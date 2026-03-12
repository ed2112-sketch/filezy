import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, Clock, CheckCircle2, Plus, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
  })
  if (!business) redirect("/signup")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalHires, pendingHires, completedThisMonth, recentHires] =
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
    ])

  const stats = [
    {
      label: "Total Hires",
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
            Add New Hire
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

      {/* Recent hires */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Hires</h2>
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
              <h3 className="text-lg font-semibold mb-2">No hires yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Add your first new hire to start collecting their paperwork
                automatically.
              </p>
              <Link href="/hires/new">
                <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
                  <Plus className="h-4 w-4" />
                  Add your first hire
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
