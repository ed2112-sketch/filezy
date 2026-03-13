"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ExternalLink, Download, FileDown, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive"; className: string }> = {
  PENDING: { label: "Pending", variant: "secondary", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", variant: "default", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  COMPLETE: { label: "Complete", variant: "default", className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
  EXPIRED: { label: "Expired", variant: "destructive", className: "bg-red-100 text-red-800 hover:bg-red-100" },
}

const MISSING_DOC_OPTIONS = [
  { value: "all", label: "All Missing Docs" },
  { value: "W4", label: "W-4" },
  { value: "I9", label: "I-9" },
  { value: "DIRECT_DEPOSIT", label: "Direct Deposit" },
  { value: "OFFER_LETTER", label: "Offer Letter" },
]

export type SerializedHire = {
  id: string
  employeeName: string
  employeeEmail: string | null
  position: string | null
  status: string
  completionPct: number
  createdAt: string
  locationName: string | null
  uploadedDocTypes: string[]
  hasExpiringDocs: boolean
}

type HiresListProps = {
  hires: SerializedHire[]
  locations: { id: string; name: string }[]
  bulkDownloadEnabled: boolean
  businessName: string
}

export default function HiresList({ hires, locations, bulkDownloadEnabled }: HiresListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [missingDocFilter, setMissingDocFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)

  const filtered = useMemo(() => {
    let result = hires

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (h) =>
          h.employeeName.toLowerCase().includes(q) ||
          (h.employeeEmail ?? "").toLowerCase().includes(q) ||
          (h.position ?? "").toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((h) => h.status === statusFilter)
    }

    // Location filter
    if (locationFilter !== "all") {
      result = result.filter((h) => h.locationName === locationFilter)
    }

    // Missing doc type filter
    if (missingDocFilter !== "all") {
      result = result.filter((h) => !h.uploadedDocTypes.includes(missingDocFilter))
    }

    return result
  }, [hires, search, statusFilter, locationFilter, missingDocFilter])

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((h) => selectedIds.has(h.id))

  function toggleAll() {
    if (allVisibleSelected) {
      const next = new Set(selectedIds)
      filtered.forEach((h) => next.delete(h.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      filtered.forEach((h) => next.add(h.id))
      setSelectedIds(next)
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  async function handleBulkDownload() {
    if (!bulkDownloadEnabled || selectedIds.size === 0) return
    setIsDownloading(true)
    try {
      const res = await fetch("/api/documents/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hireIds: [...selectedIds] }),
      })
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "documents.zip"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  function handleExportCsv() {
    window.location.href = "/api/hires/export"
  }

  const selectedCount = selectedIds.size

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name, email, or position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETE">Complete</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
        <select
          value={missingDocFilter}
          onChange={(e) => setMissingDocFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {MISSING_DOC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 accent-[#136334] cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Employee Name
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Position
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Status
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Progress
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Date
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No hires match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((hire) => {
                  const cfg = statusConfig[hire.status] ?? statusConfig.PENDING
                  const isSelected = selectedIds.has(hire.id)
                  const date = new Date(hire.createdAt)
                  return (
                    <tr
                      key={hire.id}
                      className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-[#136334]/5" : ""}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(hire.id)}
                          className="h-4 w-4 rounded border-gray-300 accent-[#136334] cursor-pointer"
                          aria-label={`Select ${hire.employeeName}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/hires/${hire.id}`}
                            className="font-medium text-foreground hover:text-[#136334] transition-colors"
                          >
                            {hire.employeeName}
                          </Link>
                          {hire.hasExpiringDocs && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs px-1.5 py-0">
                              Expiring Docs
                            </Badge>
                          )}
                        </div>
                        {hire.locationName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{hire.locationName}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {hire.position ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={cfg.variant} className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4 text-muted-foreground">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/hires/${hire.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-[#136334]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-3 shadow-xl">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} selected
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleBulkDownload}
            disabled={!bulkDownloadEnabled || isDownloading}
            title={bulkDownloadEnabled ? "Download selected documents as ZIP" : "Upgrade your plan to use bulk download"}
          >
            <Download className="h-3.5 w-3.5" />
            {isDownloading ? "Downloading…" : "Download ZIP"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleExportCsv}
          >
            <FileDown className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
