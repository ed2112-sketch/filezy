"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Loader2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Briefcase,
} from "lucide-react"

type DocInfo = {
  docType: string
  label: string
  uploaded: boolean
}

type HireInfo = {
  id: string
  businessName: string
  brandLogoUrl: string | null
  brandPrimaryColor: string | null
  employeeName: string
  position: string | null
  status: string
  completionPct: number
  uploadToken: string
  createdAt: string
  documents: DocInfo[]
}

type EmployeeInfo = {
  id: string
  name: string | null
  email: string
}

type PortalData = {
  employee: EmployeeInfo
  hires: HireInfo[]
}

export default function EmployeePortalPage() {
  const router = useRouter()
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPortal() {
      try {
        const res = await fetch("/api/employee/portal")

        if (res.status === 401) {
          router.push("/employee/login")
          return
        }

        if (!res.ok) {
          router.push("/employee/login")
          return
        }

        const result: PortalData = await res.json()
        setData(result)
      } catch {
        router.push("/employee/login")
      } finally {
        setLoading(false)
      }
    }
    fetchPortal()
  }, [router])

  if (loading || !data) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#136334]" />
          <p className="mt-4 text-muted-foreground">
            Loading your portal...
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="px-1 mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome{data.employee.name ? `, ${data.employee.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          {data.employee.email}
        </p>
      </div>

      {data.hires.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 px-4">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground mt-4 mb-2">
            No documents yet
          </h2>
          <p className="text-muted-foreground max-w-xs">
            You do not have any onboarding requests yet. When an employer
            sends you documents to complete, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.hires.map((hire) => {
            const primaryColor = hire.brandPrimaryColor || "#136334"
            const completedCount = hire.documents.filter(
              (d) => d.uploaded
            ).length
            const totalCount = hire.documents.length

            return (
              <div
                key={hire.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-semibold text-foreground">
                      {hire.businessName}
                    </h2>
                    {hire.position && (
                      <p className="text-sm text-muted-foreground">
                        {hire.position}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={hire.status} color={primaryColor} />
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {completedCount} of {totalCount} documents
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: primaryColor }}
                    >
                      {hire.completionPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${hire.completionPct}%`,
                        backgroundColor: primaryColor,
                      }}
                    />
                  </div>
                </div>

                {/* Document checklist */}
                <div className="space-y-2 mb-4">
                  {hire.documents.map((doc) => (
                    <div
                      key={doc.docType}
                      className="flex items-center gap-2"
                    >
                      {doc.uploaded ? (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0"
                          style={{ color: primaryColor }}
                        />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )}
                      <span
                        className={`text-sm ${
                          doc.uploaded
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action */}
                {hire.status !== "COMPLETE" && (
                  <a
                    href={`/upload/${hire.uploadToken}`}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {hire.completionPct > 0
                      ? "Continue uploading"
                      : "Start uploading"}
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-10 mb-6">
        Powered by Filezy
      </p>
    </Shell>
  )
}

function StatusBadge({
  status,
  color,
}: {
  status: string
  color: string
}) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETE: "Complete",
    EXPIRED: "Expired",
  }

  const isComplete = status === "COMPLETE"

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: isComplete ? `${color}15` : undefined,
        color: isComplete ? color : undefined,
      }}
    >
      {isComplete && (
        <CheckCircle2
          className="h-3 w-3 mr-1"
          style={{ color }}
        />
      )}
      {labels[status] || status}
    </span>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#136334] flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Filezy
          </span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
