import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCommissionRate } from "@/lib/commission"
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const tierInfo = [
  { tier: 1, rate: 20, min: 0, max: 5, label: "Starter" },
  { tier: 2, rate: 25, min: 6, max: 20, label: "Growth" },
  { tier: 3, rate: 30, min: 21, max: Infinity, label: "Elite" },
]

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

export default async function EarningsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const accountant = await db.accountant.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: {
        orderBy: { createdAt: "desc" },
        include: {
          business: { select: { name: true } },
        },
      },
    },
  })

  if (!accountant) redirect("/portal/join")

  const currentRate = getCommissionRate(accountant.activeReferralCount)
  const currentPct = currentRate * 100
  const currentTier = tierInfo.find((t) => t.rate === currentPct) ?? tierInfo[0]
  const nextTier = tierInfo.find((t) => t.rate > currentPct)

  const totalEarned = accountant.totalEarnedCents
  const pendingAmount = accountant.commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.commissionAmountCents, 0)
  const paidAmount = accountant.commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.commissionAmountCents, 0)

  // Progress to next tier
  const referralsToNext = nextTier
    ? nextTier.min - accountant.activeReferralCount
    : 0
  const progressPct = nextTier
    ? Math.min(
        100,
        ((accountant.activeReferralCount - currentTier.min) /
          (nextTier.min - currentTier.min)) *
          100
      )
    : 100

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
          <p className="text-muted-foreground mt-1">
            Track your commissions and payouts
          </p>
        </div>
        {!accountant.stripeConnectAccountId && (
          <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
            <CreditCard className="h-4 w-4" />
            Connect Stripe
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#136334]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#136334]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">{formatCents(totalEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {formatCents(pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Out</p>
                <p className="text-2xl font-bold">{formatCents(paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission tier card */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Commission Tier</h2>
              <p className="text-sm text-muted-foreground">
                {accountant.activeReferralCount} active referral
                {accountant.activeReferralCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge className="bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/10 text-base px-3 py-1">
              {currentPct}% - {currentTier.label}
            </Badge>
          </div>

          {/* Tier progression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              {tierInfo.map((t) => (
                <span
                  key={t.tier}
                  className={`font-medium ${
                    t.rate === currentPct
                      ? "text-[#136334]"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.rate}% ({t.label})
                </span>
              ))}
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-[#136334] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {nextTier ? (
              <p className="text-sm text-muted-foreground">
                {referralsToNext} more referral
                {referralsToNext !== 1 ? "s" : ""} to reach {nextTier.rate}%
                commission
              </p>
            ) : (
              <p className="text-sm text-[#136334] font-medium">
                You have reached the highest commission tier!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Commission History</h2>
        {accountant.commissions.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#136334]/10 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-[#136334]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No commissions yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                When your referred businesses pay their Filezy subscription,
                commissions will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Business
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Invoice Date
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Gross
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Rate
                    </th>
                    <th className="text-right font-medium text-muted-foreground px-6 py-3">
                      Commission
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountant.commissions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {c.business.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {c.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCents(c.grossAmountCents)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.commissionPct}%
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCents(c.commissionAmountCents)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className={
                            c.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {c.status.charAt(0) +
                            c.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
