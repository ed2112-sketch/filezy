import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
    include: { owner: true },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const { plan } = await request.json()

  // STARTER is free - just downgrade
  if (plan === "STARTER") {
    // Cancel existing subscription if any
    if (business.stripeSubscriptionId) {
      await getStripe().subscriptions.cancel(business.stripeSubscriptionId)
    }
    await db.business.update({
      where: { id: business.id },
      data: { plan: "STARTER", stripeSubscriptionId: null },
    })
    return NextResponse.json({ success: true })
  }

  // GROWTH and PRO need Stripe subscriptions
  const priceId = plan === "GROWTH"
    ? process.env.STRIPE_PRICE_GROWTH
    : plan === "PRO"
      ? process.env.STRIPE_PRICE_PRO
      : null

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  // Get or create Stripe customer
  let customerId = business.stripeCustomerId

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: business.owner.email,
      name: business.name,
      metadata: { businessId: business.id },
    })
    customerId = customer.id

    await db.business.update({
      where: { id: business.id },
      data: { stripeCustomerId: customerId },
    })
  }

  // If already subscribed, switch the plan via subscription update
  if (business.stripeSubscriptionId) {
    const subscription = await getStripe().subscriptions.retrieve(business.stripeSubscriptionId)
    await getStripe().subscriptions.update(business.stripeSubscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: "create_prorations",
    })
    return NextResponse.json({ success: true })
  }

  // New subscription via checkout
  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
    subscription_data: {
      metadata: { businessId: business.id },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
