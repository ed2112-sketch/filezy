import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { calculateCommission } from "@/lib/commission"
import type { Plan } from "@/lib/generated/prisma/client"
import Stripe from "stripe"

function getPriceToPlan(): Record<string, Plan> {
  return {
    [process.env.STRIPE_PRICE_STARTER || ""]: "STARTER",
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
          await db.business.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan,
              stripeSubscriptionId: subscription.id,
            },
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
