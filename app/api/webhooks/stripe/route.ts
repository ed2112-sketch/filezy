import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { calculateCommission } from "@/lib/commission"
import { PLAN_LIMITS } from "@/lib/plans"
import type { Plan } from "@/lib/generated/prisma/client"
import Stripe from "stripe"

function getPriceToPlan(): Record<string, Plan> {
  return {
    [process.env.STRIPE_PRICE_GROWTH || ""]: "GROWTH",
    [process.env.STRIPE_PRICE_PRO || ""]: "PRO",
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id

        if (!customerId) break

        const business = await db.business.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (!business) break

        if (business.referredByAccountantId) {
          const accountant = await db.accountant.findUnique({
            where: { id: business.referredByAccountantId },
          })

          if (accountant) {
            const grossCents = invoice.amount_paid
            const { commissionCents, pct } = calculateCommission(
              grossCents,
              accountant.activeReferralCount
            )

            const isPaid = !!accountant.stripeConnectAccountId

            await db.commission.create({
              data: {
                accountantId: accountant.id,
                businessId: business.id,
                stripeInvoiceId: invoice.id,
                grossAmountCents: grossCents,
                commissionAmountCents: commissionCents,
                commissionPct: pct,
                periodStart: invoice.period_start
                  ? new Date(invoice.period_start * 1000)
                  : null,
                periodEnd: invoice.period_end
                  ? new Date(invoice.period_end * 1000)
                  : null,
                status: isPaid ? "PAID" : "PENDING",
                paidAt: isPaid ? new Date() : null,
              },
            })

            await db.accountant.update({
              where: { id: accountant.id },
              data: {
                totalEarnedCents: {
                  increment: commissionCents,
                },
              },
            })
          }
        }
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id

        if (!customerId || !subscriptionId) break

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price?.id
        const plan = priceId ? getPriceToPlan()[priceId] : undefined
        const item = subscription.items.data[0]

        await db.business.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            ...(plan ? { plan } : {}),
            currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
            currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id

        if (!customerId) break

        await db.business.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "STARTER", stripeSubscriptionId: null },
        })
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id

        if (!customerId) break

        const priceId = subscription.items.data[0]?.price?.id
        const plan = priceId ? getPriceToPlan()[priceId] : undefined

        if (plan) {
          const item = subscription.items.data[0]
          await db.business.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan,
              stripeSubscriptionId: subscription.id,
              currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
              currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
            },
          })
        }
        break
      }

      case "invoice.created": {
        // Add overage line items before invoice is finalized
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.status !== "draft") break

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id
        if (!customerId) break

        const business = await db.business.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (!business || business.plan === "STARTER") break

        const limits = PLAN_LIMITS[business.plan]
        const periodStart = business.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const periodEnd = business.currentPeriodEnd ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)

        // Count unbilled overage usage for the billing period
        const unbilledUsage = await db.onboardingUsage.findMany({
          where: {
            businessId: business.id,
            completedAt: { gte: periodStart, lte: periodEnd },
            chargedCents: { not: null },
            stripeUsageId: null,
          },
        })

        if (unbilledUsage.length === 0) break

        const totalOverageCents = unbilledUsage.reduce((sum, u) => sum + (u.chargedCents ?? 0), 0)

        if (totalOverageCents > 0) {
          // Add overage as a line item on the draft invoice
          const invoiceItem = await getStripe().invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: totalOverageCents,
            currency: "usd",
            description: `Overage: ${unbilledUsage.length} onboarding${unbilledUsage.length === 1 ? "" : "s"} at $${(limits.overagePriceCents / 100).toFixed(2)}/each (beyond ${limits.includedOnboardings} included)`,
          })

          // Mark usage records as billed
          await db.onboardingUsage.updateMany({
            where: { id: { in: unbilledUsage.map((u) => u.id) } },
            data: { stripeUsageId: invoiceItem.id },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}
