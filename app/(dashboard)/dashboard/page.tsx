import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, Clock, CheckCircle2, Plus, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DOCUMENT_TYPES } from "@/lib/documents"
import { getWorkflowLabels } from "@/lib/workflow-labels"

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive"; className: string }> = {
  PENDING: { label: "Pending", variant: "secondary", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", variant: "default", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  COMPLETE: { label: "Complete", variant: "default", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  EXPIRED: { label: "Expired", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      workflowType: true,
    },
  })
  if (!business) redirect("/signup")

  const labels = getWorkflowLabels(business.workflowType)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [totalHires, pendingHires, completedThisMonth, recentHires, expiringSoon] =
    await Promise.all([
      db.hire.count({ where: { businessId: business.id } }),
      db.hire.count({
        where: {
          businessId: business.id,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
      db.hire.count({
        where: {
          businessId: business.id,
          status: "COMPLETE",
          updatedAt: { gte: monthStart },
        },
      }),
      db.hire.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.documentExpiration.findMany({
        where: {
          isResolved: false,
          expiresAt: { gte: now, lte: in30Days },
          document: { hire: { businessId: business.id } },
        },
        include: {
          document: {
            include: { hire: true },
          },
        },
        orderBy: { expiresAt: "asc" },
      }),
    ])

  const stats = [
    {
      label: `Total ${labels.hires}`,
      value: totalHires,
      icon: Users,
      color: "text-[#136334]",
      bg: "bg-[#136334]/10",
    },
    {
      label: "Pending",
      value: pendingHires,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Completed This Month",
      value: completedThisMonth,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {session.user.name ?? "there"}
          </h1>
          <p className="text-muted-foreground mt-1">{business.name}</p>
        </div>
        <Link href="/hires/new">
          <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
            <Plus className="h-4 w-4" />
            {labels.addHire}
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Expiring Soon</h2>
          </div>
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-amber-50/60">
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Document
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Employee
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expiringSoon.map((exp) => {
                    const docTypeKey = exp.document.docType as keyof typeof DOCUMENT_TYPES
                    const docLabel = DOCUMENT_TYPES[docTypeKey]?.label ?? exp.document.docType
                    const daysUntil = Math.ceil(
                      (exp.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    const isUrgent = daysUntil <= 7
                    return (
                      <tr
                        key={exp.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{docLabel}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {exp.document.hire.employeeName}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              isUrgent
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {daysUntil === 1 ? "1 day" : `${daysUntil} days`}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Recent hires */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent {labels.hires}</h2>
          {totalHires > 5 && (
            <Link href="/hires">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View all
              </Button>
            </Link>
          )}
        </div>

        {recentHires.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#136334]/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-[#136334]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No {labels.hires.toLowerCase()} yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Add your first {labels.hire.toLowerCase()} to start collecting their paperwork
                automatically.
              </p>
              <Link href="/hires/new">
                <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
                  <Plus className="h-4 w-4" />
                  {labels.addHire}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Name
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Position
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Progress
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentHires.map((hire) => {
                    const cfg = statusConfig[hire.status] ?? statusConfig.PENDING
                    return (
                      <tr
                        key={hire.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/hires/${hire.id}`}
                            className="font-medium text-foreground hover:text-[#136334] transition-colors"
                          >
                            {hire.employeeName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {hire.position ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={cfg.variant} className={cfg.className}>
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#136334] transition-all"
                                style={{ width: `${hire.completionPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {hire.completionPct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {hire.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
