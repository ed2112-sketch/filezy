"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type DocumentVersion = {
  id: string
  version: number
  fileName: string
  uploadedAt: string | Date
  status: "CURRENT" | "PENDING_REVIEW" | "ARCHIVED" | "REJECTED"
}

type DocumentWithVersions = {
  id: string
  docType: string
  versions: DocumentVersion[]
  expiration?: {
    expiresAt: string | Date
    isResolved: boolean
  } | null
}

const versionStatusConfig: Record<
  DocumentVersion["status"],
  { label: string; className: string }
> = {
  CURRENT: {
    label: "Current",
    className: "bg-emerald-100 text-emerald-800",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-800",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-gray-100 text-gray-600",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function DocumentVersionHistory({
  document,
}: {
  document: DocumentWithVersions
}) {
  const [expanded, setExpanded] = useState(false)
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | null
  >(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const router = useRouter()

  const pendingVersion = document.versions.find(
    (v) => v.status === "PENDING_REVIEW"
  )

  async function handleApprove() {
    if (!pendingVersion) return
    setLoadingAction("approve")
    setActionMessage(null)
    try {
      const res = await fetch(`/api/documents/${document.id}/approve`, {
        method: "POST",
      })
      if (res.ok) {
        setActionMessage("Version approved.")
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setActionMessage(data?.error ?? "Failed to approve.")
      }
    } catch {
      setActionMessage("Network error. Please try again.")
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleReject() {
    if (!pendingVersion) return
    setLoadingAction("reject")
    setActionMessage(null)
    try {
      const res = await fetch(`/api/documents/${document.id}/reject`, {
        method: "POST",
      })
      if (res.ok) {
        setActionMessage("Version rejected.")
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setActionMessage(data?.error ?? "Failed to reject.")
      }
    } catch {
      setActionMessage("Network error. Please try again.")
    } finally {
      setLoadingAction(null)
    }
  }

  if (document.versions.length === 0) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {document.versions.length === 1
          ? "1 version"
          : `${document.versions.length} versions`}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-muted">
          {document.versions.map((v) => {
            const statusCfg =
              versionStatusConfig[v.status] ?? versionStatusConfig.ARCHIVED
            return (
              <div
                key={v.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground shrink-0">
                    v{v.version}
                  </span>
                  <span className="truncate font-medium">{v.fileName}</span>
                  <span className="text-muted-foreground shrink-0 hidden sm:inline">
                    {formatDate(v.uploadedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={`text-[10px] py-0 px-1.5 ${statusCfg.className}`}>
                    {statusCfg.label}
                  </Badge>
                  <a
                    href={`/api/documents/${document.id}/download`}
                    title="Download this version"
                    className="text-[#136334] hover:text-[#136334]/80 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )
          })}

          {pendingVersion && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                disabled={loadingAction !== null}
                onClick={handleApprove}
              >
                {loadingAction === "approve" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                disabled={loadingAction !== null}
                onClick={handleReject}
              >
                {loadingAction === "reject" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                Reject
              </Button>
              {actionMessage && (
                <span className="text-xs text-muted-foreground">
                  {actionMessage}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PendingApprovalsCard({
  documents,
}: {
  documents: DocumentWithVersions[]
}) {
  const docsWithPending = documents.filter((d) =>
    d.versions.some((v) => v.status === "PENDING_REVIEW")
  )

  if (docsWithPending.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
        <h2 className="font-semibold text-amber-900 text-sm">
          Pending Approvals
        </h2>
      </div>
      <p className="text-xs text-amber-700 mb-1">
        {docsWithPending.length === 1
          ? "1 document has"
          : `${docsWithPending.length} documents have`}{" "}
        a replacement waiting for your review. Expand the version history below
        to approve or reject.
      </p>
      <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
        {docsWithPending.map((d) => (
          <li key={d.id}>{d.docType}</li>
        ))}
      </ul>
    </div>
  )
}
