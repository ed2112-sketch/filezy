"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Loader2,
} from "lucide-react"

interface SummaryStats {
  totalHires: number
  byStatus: {
    pending: number
    inProgress: number
    complete: number
    expired: number
  }
  completionRate: number
  avgCompletionDays: number
  docsByType: Record<string, number>
}

interface RecentCompletion {
  id: string
  employeeName: string
  employeeEmail: string | null
  position: string | null
  completionPct: number
  createdAt: string
  updatedAt: string
}

export function ReportsDashboard({
  stats,
  recentCompletions,
}: {
  stats: SummaryStats
  recentCompletions: RecentCompletion[]
}) {
  const [downloading, setDownloading] = useState<string | null>(null)

  async function handleDownload(type: "completion" | "compliance") {
    setDownloading(type)
    try {
      const res = await fetch(`/api/reports?type=${type}`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download =
        type === "completion"
          ? "completion-report.csv"
          : "compliance-report.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setDownloading(null)
    }
  }

  const statCards = [
    {
      label: "Total Hires",
      value: stats.totalHires,
      icon: Users,
      color: "text-[#136334]",
      bg: "bg-[#136334]/10",
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg. Completion Time",
      value: stats.avgCompletionDays > 0 ? `${stats.avgCompletionDays}d` : "N/A",
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: stats.byStatus.pending,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Overview and downloadable reports for your hires
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
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

      {/* Download buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#136334]/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-[#136334]" />
              </div>
              <div>
                <p className="font-medium">Completion Report</p>
                <p className="text-sm text-muted-foreground">
                  All hires with status and completion data
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleDownload("completion")}
              disabled={downloading !== null}
              className="gap-2 bg-[#136334] hover:bg-[#136334]/90"
            >
              {downloading === "completion" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Compliance Report</p>
                <p className="text-sm text-muted-foreground">
                  Hires with missing required documents
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleDownload("compliance")}
              disabled={downloading !== null}
              variant="outline"
              className="gap-2"
            >
              {downloading === "compliance" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent completions table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Completions</h2>
        {recentCompletions.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No completed hires yet.
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
                      Name
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Position
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Status
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Completed
                    </th>
                    <th className="text-left font-medium text-muted-foreground px-6 py-3">
                      Days to Complete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompletions.map((hire) => {
                    const created = new Date(hire.createdAt)
                    const completed = new Date(hire.updatedAt)
                    const days = Math.round(
                      (completed.getTime() - created.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                    return (
                      <tr
                        key={hire.id}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">
                          {hire.employeeName}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {hire.position ?? "\u2014"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            Complete
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {completed.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {days === 0 ? "<1" : days} {days === 1 ? "day" : "days"}
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
