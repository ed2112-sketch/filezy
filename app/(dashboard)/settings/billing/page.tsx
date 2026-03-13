"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Loader2,
  CreditCard,
  Check,
  Zap,
  Rocket,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Get started with the basics",
    features: ["1 hire per year", "Standard documents", "Email support"],
    priceId: null,
    icon: CreditCard,
  },
  {
    key: "STARTER",
    name: "Starter",
    price: "$19",
    period: "/mo",
    description: "For growing businesses",
    features: [
      "10 hires per year",
      "Standard documents",
      "Email support",
      "Priority processing",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID!,
    icon: Zap,
    popular: true,
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$39",
    period: "/mo",
    description: "For teams that hire often",
    features: [
      "Unlimited hires",
      "Custom documents",
      "SMS notifications",
      "Priority support",
      "Advanced reporting",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    icon: Rocket,
  },
  {
    key: "BUSINESS",
    name: "Business",
    price: "$79",
    period: "/month",
    description: "For large organizations",
    features: [
      "Unlimited hires",
      "Unlimited everything",
      "API access",
      "Custom branding",
      "Priority support",
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID!,
    icon: Rocket,
  },
]

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState("FREE")
  const [hasSubscription, setHasSubscription] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setMessage({
        type: "success",
        text: "Subscription activated successfully! Your plan may take a moment to update.",
      })
    }
    if (searchParams.get("canceled") === "true") {
      setMessage({ type: "error", text: "Checkout was canceled." })
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/business/settings")
        if (!res.ok) return
        const data = await res.json()
        setCurrentPlan(data.plan ?? "FREE")
        setHasSubscription(data.plan !== "FREE")
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchBilling()
  }, [])

  async function handleUpgrade(priceId: string) {
    setActionLoading(priceId)
    setMessage(null)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Something went wrong." })
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal")
    setMessage(null)

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Something went wrong." })
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing details.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current plan banner */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Current Plan</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/15">
                  {PLANS.find((p) => p.key === currentPlan)?.name ?? currentPlan}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentPlan === "FREE" && "1 hire per year"}
                  {currentPlan === "STARTER" && "10 hires per year"}
                  {(currentPlan === "PRO" || currentPlan === "BUSINESS") && "Unlimited hires"}
                </span>
              </div>
            </div>
            {hasSubscription && (
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
              >
                {actionLoading === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan
          const isDowngrade =
            (currentPlan === "BUSINESS" && plan.key !== "BUSINESS") ||
            (currentPlan === "PRO" && plan.key !== "PRO" && plan.key !== "BUSINESS") ||
            (currentPlan === "STARTER" && plan.key === "FREE")

          return (
            <Card
              key={plan.key}
              className={`rounded-2xl border shadow-sm relative ${
                plan.popular
                  ? "border-[#136334] shadow-md"
                  : isCurrent
                  ? "border-[#136334]/30"
                  : "border-0"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#136334] text-white hover:bg-[#136334]/90">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${
                      isCurrent
                        ? "bg-[#136334]/10"
                        : "bg-muted"
                    }`}
                  >
                    <plan.icon
                      className={`h-5 w-5 ${
                        isCurrent ? "text-[#136334]" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-[#136334] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full rounded-xl bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/10"
                    variant="ghost"
                  >
                    Current Plan
                  </Button>
                ) : isDowngrade ? (
                  hasSubscription ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={handleManageBilling}
                      disabled={actionLoading === "portal"}
                    >
                      {actionLoading === "portal" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Downgrade"
                      )}
                    </Button>
                  ) : null
                ) : plan.priceId ? (
                  <Button
                    className="w-full rounded-xl bg-[#136334] hover:bg-[#136334]/90"
                    onClick={() => handleUpgrade(plan.priceId!)}
                    disabled={actionLoading === plan.priceId}
                  >
                    {actionLoading === plan.priceId ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ-style note */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            All plans are billed monthly. You can upgrade, downgrade, or cancel
            at any time. Changes take effect at the start of your next billing
            cycle. Need help?{" "}
            <a
              href="mailto:support@filezy.com"
              className="text-[#136334] hover:underline"
            >
              Contact support
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
