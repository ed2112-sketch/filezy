import Stripe from "stripe"
import type { Plan } from "@/lib/generated/prisma/client"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  }
  return _stripe
}

export function getPriceToPlan(): Record<string, Plan> {
  const map: Record<string, Plan> = {}
  if (process.env.STRIPE_PRICE_STARTER) map[process.env.STRIPE_PRICE_STARTER] = "STARTER"
  if (process.env.STRIPE_PRICE_PRO) map[process.env.STRIPE_PRICE_PRO] = "PRO"
  if (process.env.STRIPE_PRICE_BUSINESS) map[process.env.STRIPE_PRICE_BUSINESS] = "BUSINESS"
  return map
}

export function getPlanToPrice(): Record<string, string | undefined> {
  return {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PRO: process.env.STRIPE_PRICE_PRO,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  }
}
