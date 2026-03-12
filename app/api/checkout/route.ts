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

  const { priceId } = await request.json()
  if (!priceId || typeof priceId !== "string") {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 })
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
