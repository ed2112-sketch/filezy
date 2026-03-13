"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  ScrollText,
} from "lucide-react"

const ACTION_LABELS: Record<string, string> = {
  UPLOADED: "Document uploaded",
  SIGNED: "Document signed",
  APPROVED: "Document approved",
  REJECTED: "Document rejected",
  REPLACED: "Document replaced",
  DOWNLOADED: "Document downloaded",
  VIEWED: "Document viewed",
  CHECKLIST_COMPLETED: "Checklist completed",
  LOGIN: "User logged in",
  REMINDER_SENT: "Reminder sent",
  REPORT_GENERATED: "Report generated",
  HIRE_CREATED: "Hire created",
  HIRE_APPROVED: "Hire approved",
  CONTENT_VIEWED: "Content viewed",
  CONTENT_SIGNED: "Content signed",
}

const ACTION_COLORS: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-800",
  SIGNED: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  REPLACED: "bg-amber-100 text-amber-800",
  DOWNLOADED: "bg-indigo-100 text-indigo-800",
  VIEWED: "bg-gray-100 text-gray-700",
  CHECKLIST_COMPLETED: "bg-emerald-100 text-emerald-800",
  LOGIN: "bg-purple-100 text-purple-800",
  REMINDER_SENT: "bg-orange-100 text-orange-800",
  REPORT_GENERATED: "bg-cyan-100 text-cyan-800",
  HIRE_CREATED: "bg-[#136334]/10 text-[#136334]",
  HIRE_APPROVED: "bg-green-100 text-green-800",
  CONTENT_VIEWED: "bg-gray-100 text-gray-700",
  CONTENT_SIGNED: "bg-emerald-100 text-emerald-800",
}

const ACTOR_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Admin",
  SYSTEM: "System",
}

type AuditLog = {
  id: string
  action: string
  actorType: string
  actorId: string | null
  hireId: string | null
  documentId: string | null
  ip: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  hireName: string | null
}

type Props = {
  initialLogs: AuditLog[]
  initialTotal: number
}

const LIMIT = 50

export default function AuditLogViewer({ initialLogs, initialTotal }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("")
  const [loading, setLoading] = useState(false)

  const totalPages = Math.ceil(total / LIMIT)

  async function fetchLogs(newPage: number, action: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(newPage),
        limit: String(LIMIT),
      })
      if (action) params.set("action", action)

      const res = await fetch(`/api/audit?${params}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
      setPage(data.page)
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setActionFilter(value)
    setPage(1)
    fetchLogs(1, value)
  }

  function handlePrev() {
    if (page > 1) fetchLogs(page - 1, actionFilter)
  }

  function handleNext() {
    if (page < totalPages) fetchLogs(page + 1, actionFilter)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  function getDetails(log: AuditLog) {
    const parts: string[] = []
    if (log.hireName) parts.push(log.hireName)
    if (log.metadata) {
      const meta = log.metadata
      if (typeof meta.docType === "string") parts.push(meta.docType)
      if (typeof meta.fileName === "string") parts.push(meta.fileName)
      if (typeof meta.reason === "string") parts.push(meta.reason)
    }
    return parts.join(" - ") || "-"
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <select
              value={actionFilter}
              onChange={handleFilterChange}
              className="rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#136334]/30"
            >
              <option value="">All actions</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Table */}
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#136334]/10 flex items-center justify-center mb-4">
              <ScrollText className="h-8 w-8 text-[#136334]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No audit logs</h3>
            <p className="text-muted-foreground max-w-sm">
              Activity will appear here as actions are performed.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={loading ? "opacity-50" : ""}>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"
                      }
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {ACTOR_LABELS[log.actorType] ?? log.actorType}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {getDetails(log)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page <= 1 || loading}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages || loading}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
