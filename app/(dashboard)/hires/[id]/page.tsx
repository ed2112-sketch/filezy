import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DOCUMENT_TYPES, REQUIRED_DOC_TYPES } from "@/lib/documents"
import { HireActions } from "./hire-actions"

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-100 text-amber-800" },
  COMPLETE: { label: "Complete", className: "bg-emerald-100 text-emerald-800" },
  EXPIRED: { label: "Expired", className: "bg-red-100 text-red-800" },
}

type TimelineStep = {
  label: string
  done: boolean
}

export default async function HireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) redirect("/signup")

  const hire = await db.hire.findUnique({
    where: { id },
    include: {
      documents: {
        include: { currentVersion: { select: { fileName: true } } },
      },
    },
  })

  if (!hire || hire.businessId !== business.id) notFound()

  const cfg = statusConfig[hire.status] ?? statusConfig.PENDING
  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`

  const uploadedTypes = new Set(hire.documents.map((d) => d.docType))

  // Timeline steps
  const timeline: TimelineStep[] = [
    { label: "Created", done: true },
    {
      label: "Employee notified",
      done: hire.status !== "PENDING" || hire.documents.length > 0,
    },
    {
      label: "In progress",
      done: hire.status === "IN_PROGRESS" || hire.status === "COMPLETE",
    },
    { label: "Complete", done: hire.status === "COMPLETE" },
    {
      label: "Accountant notified",
      done: !!hire.accountantNotifiedAt,
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/hires"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to hires
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {hire.employeeName}
            </h1>
            <Badge className={cfg.className}>{cfg.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {hire.employeeEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {hire.employeeEmail}
              </span>
            )}
            {hire.employeePhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {hire.employeePhone}
              </span>
            )}
            {hire.position && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                {hire.position}
              </span>
            )}
            {hire.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Start:{" "}
                {hire.startDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <HireActions hireId={hire.id} uploadUrl={uploadUrl} />

      {/* Status timeline */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Status Timeline</h2>
          <div className="flex items-center gap-0">
            {timeline.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  {step.done ? (
                    <CheckCircle2 className="h-6 w-6 text-[#136334]" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/30" />
                  )}
                  <span
                    className={`text-xs text-center max-w-[80px] leading-tight ${
                      step.done
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < timeline.length - 1 && (
                  <div
                    className={`h-0.5 w-8 sm:w-12 mx-1 mt-[-18px] ${
                      step.done && timeline[i + 1].done
                        ? "bg-[#136334]"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Document Progress</h2>
            <span className="text-sm font-medium text-[#136334]">
              {hire.completionPct}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-[#136334] transition-all duration-500"
              style={{ width: `${hire.completionPct}%` }}
            />
          </div>

          <div className="space-y-3">
            {REQUIRED_DOC_TYPES.map((docType) => {
              const docInfo = DOCUMENT_TYPES[docType]
              const uploaded = hire.documents.find((d) => d.docType === docType)
              return (
                <div
                  key={docType}
                  className={`flex items-center justify-between rounded-xl p-3 ${
                    uploaded ? "bg-emerald-50/50" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {uploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          uploaded ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {docInfo.label}
                      </p>
                      {uploaded && (
                        <p className="text-xs text-muted-foreground">
                          {uploaded.currentVersion?.fileName}
                        </p>
                      )}
                    </div>
                  </div>
                  {uploaded && (
                    <a
                      href={`/api/documents/${uploaded.id}/download`}
                      className="text-[#136334] hover:text-[#136334]/80 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
