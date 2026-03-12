import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, Building2, FileText, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const planLabels: Record<string, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
}

export default async function AccountantClientsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const accountant = await db.accountant.findUnique({
    where: { userId: session.user.id },
    include: {
      referredBusinesses: {
        include: {
          hires: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              documents: { select: { id: true, reviewed: true } },
            },
          },
          _count: { select: { hires: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!accountant) redirect("/portal/join")

  const businesses = accountant.referredBusinesses

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Clients</h1>
          <p className="text-muted-foreground mt-1">
            Businesses referred through your Filezy partner link
          </p>
        </div>
        <Link href="/portal/referral">
          <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
            <Users className="h-4 w-4" />
            Refer a Client
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#136334]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#136334]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{businesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hires</p>
                <p className="text-2xl font-bold">
                  {businesses.reduce((sum, b) => sum + b._count.hires, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Tier</p>
                <p className="text-2xl font-bold">
                  {accountant.commissionTier === 3
                    ? "30%"
                    : accountant.commissionTier === 2
                    ? "25%"
                    : "20%"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client list */}
      {businesses.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#136334]/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-[#136334]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Share your referral link with businesses to start earning
              commissions on their Filezy subscriptions.
            </p>
            <Link href="/portal/referral">
              <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
                <Link href="/portal/referral" className="contents">
                  Get Your Referral Link
                </Link>
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => (
            <Card
              key={business.id}
              className="rounded-2xl border-0 shadow-sm overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{business.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/10"
                      >
                        {planLabels[business.plan] ?? business.plan}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {business._count.hires} hire
                        {business._count.hires !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Joined{" "}
                    {business.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {business.hires.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Recent Hires
                    </p>
                    <div className="space-y-2">
                      {business.hires.map((hire) => {
                        const totalDocs = hire.documents.length
                        const reviewedDocs = hire.documents.filter(
                          (d) => d.reviewed
                        ).length
                        return (
                          <div
                            key={hire.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {hire.employeeName}
                              </span>
                              {hire.position && (
                                <span className="text-muted-foreground">
                                  - {hire.position}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className={
                                  hire.status === "COMPLETE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : hire.status === "IN_PROGRESS"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {hire.status === "IN_PROGRESS"
                                  ? "In Progress"
                                  : hire.status.charAt(0) +
                                    hire.status.slice(1).toLowerCase()}
                              </Badge>
                              {totalDocs > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {reviewedDocs}/{totalDocs} docs reviewed
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
