"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Upload,
  CheckCircle2,
  FileText,
  Camera,
  AlertCircle,
  Loader2,
  PartyPopper,
  PenLine,
  FileCheck,
  Sun,
  Eye,
  Calendar,
} from "lucide-react"
import { DOCUMENT_TYPES } from "@/lib/documents"
import { getFormDefinition } from "@/lib/forms"
import { FormFillFlow } from "@/components/upload/form-fill-flow"
import { getValidationTips } from "@/lib/document-validation-tips"

type DocStatus = {
  docType: string
  fileName: string | null
  uploadedAt: string | null
}

type HireData = {
  employeeName: string
  businessName: string
  position: string | null
  status: string
  completionPct: number
  requiredDocTypes: string[] | null
  brandLogoUrl: string | null
  brandPrimaryColor: string | null
  brandAccentColor: string | null
  documents: DocStatus[]
}

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; data: HireData }
  | { kind: "expired"; businessName?: string }
  | { kind: "not_found" }
  | { kind: "complete"; data: HireData }
  | { kind: "error" }

export default function UploadPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [state, setState] = useState<PageState>({ kind: "loading" })
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [justUploaded, setJustUploaded] = useState<string | null>(null)
  const [activeFormFill, setActiveFormFill] = useState<string | null>(null)

  const fetchHire = useCallback(async () => {
    try {
      const res = await fetch(`/api/upload/${token}`)
      if (res.status === 404) {
        setState({ kind: "not_found" })
        return
      }
      if (res.status === 410) {
        const data = await res.json()
        setState({ kind: "expired", businessName: data.businessName })
        return
      }
      if (!res.ok) {
        setState({ kind: "error" })
        return
      }
      const data: HireData = await res.json()
      if (data.status === "COMPLETE" || data.completionPct === 100) {
        setState({ kind: "complete", data })
      } else {
        setState({ kind: "ready", data })
      }
    } catch {
      setState({ kind: "error" })
    }
  }, [token])

  useEffect(() => {
    fetchHire()
  }, [fetchHire])

  async function handleUpload(docType: string, file: File) {
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("This file is too large. The maximum size is 20 MB.")
      return
    }

    setUploadingDoc(docType)
    setUploadError(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("docType", docType)

    try {
      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error === "file_too_large") {
          setUploadError("This file is too large. The maximum size is 20 MB.")
        } else if (err.error === "invalid_file_type") {
          setUploadError(
            "This file type isn't supported. Please upload a PDF, JPG, or PNG."
          )
        } else {
          setUploadError("Upload failed. Check your connection and try again.")
        }
        setUploadingDoc(null)
        return
      }

      const result = await res.json()

      setJustUploaded(docType)
      setTimeout(() => setJustUploaded(null), 2000)

      if (state.kind === "ready") {
        const updatedDocs = [
          ...state.data.documents.filter((d) => d.docType !== docType),
          { docType, fileName: file.name, uploadedAt: new Date().toISOString() },
        ]
        const updatedData = {
          ...state.data,
          documents: updatedDocs,
          completionPct: result.completionPct,
          status: result.status,
        }
        if (result.status === "COMPLETE") {
          setState({ kind: "complete", data: updatedData })
        } else {
          setState({ kind: "ready", data: updatedData })
        }
      }
    } catch {
      setUploadError("Upload failed. Check your connection and try again.")
    } finally {
      setUploadingDoc(null)
    }
  }

  // Loading
  if (state.kind === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your documents...</p>
        </div>
      </Shell>
    )
  }

  // Not found
  if (state.kind === "not_found") {
    return (
      <Shell>
        <ErrorCard
          icon={<AlertCircle className="h-12 w-12 text-destructive" />}
          title="Link not found"
          message="This upload link doesn't exist. Please check the link your employer sent you, or ask them to resend it."
        />
      </Shell>
    )
  }

  // Expired
  if (state.kind === "expired") {
    return (
      <Shell>
        <ErrorCard
          icon={<AlertCircle className="h-12 w-12 text-amber-500" />}
          title="This link has expired"
          message={
            state.businessName
              ? `Contact ${state.businessName} and ask them to send you a new link.`
              : "Contact your employer and ask them to send you a new link."
          }
        />
      </Shell>
    )
  }

  // Error
  if (state.kind === "error") {
    return (
      <Shell>
        <ErrorCard
          icon={<AlertCircle className="h-12 w-12 text-destructive" />}
          title="Something went wrong"
          message="We couldn't load your documents. Please try refreshing the page."
        />
      </Shell>
    )
  }

  // Complete
  if (state.kind === "complete") {
    const { data } = state
    return (
      <Shell brandLogoUrl={data.brandLogoUrl} businessName={data.businessName}>
        <div
          style={{
            '--brand-primary': data.brandPrimaryColor || '#136334',
            '--brand-accent': data.brandAccentColor || '#36c973',
          } as React.CSSProperties}
        >
          <div className="flex flex-col items-center text-center py-12 px-4">
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <PartyPopper
                className="h-12 w-12"
                style={{ color: 'var(--brand-primary)' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              You're all set!
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm">
              All your documents have been submitted.{" "}
              <span className="font-medium text-foreground">
                {data.businessName}
              </span>{" "}
              has been notified.
            </p>
            <div className="mt-8 w-full max-w-sm">
              <ProgressBar pct={100} />
              <p className="text-sm text-muted-foreground mt-2">
                All documents complete
              </p>
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  // Ready — main upload view
  const { data } = state
  const uploadedTypes = new Set(data.documents.map((d) => d.docType))
  const requiredDocs = data.requiredDocTypes ?? ["W4", "I9", "DIRECT_DEPOSIT", "OFFER_LETTER"]
  const uploadedCount = requiredDocs.filter((t) =>
    uploadedTypes.has(t)
  ).length

  return (
    <Shell brandLogoUrl={data.brandLogoUrl} businessName={data.businessName}>
      <div
        style={{
          '--brand-primary': data.brandPrimaryColor || '#136334',
          '--brand-accent': data.brandAccentColor || '#36c973',
        } as React.CSSProperties}
      >
        {activeFormFill ? (
          <FormFillFlow
            docType={activeFormFill}
            token={token}
            employeeName={data.employeeName}
            onComplete={() => {
              setActiveFormFill(null)
              fetchHire()
            }}
            onCancel={() => setActiveFormFill(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="px-1 mb-8">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-primary)' }}>
                {data.businessName}
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome, {data.employeeName}
              </h1>
              {data.position && (
                <p className="text-muted-foreground mt-1">{data.position}</p>
              )}
              <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
                Please upload the following documents to complete your new hire
                paperwork. You can take a photo or choose a file from your device.
              </p>
            </div>

            {/* Progress */}
            <div className="mb-8 px-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {uploadedCount} of {requiredDocs.length} documents
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>
                  {data.completionPct}%
                </span>
              </div>
              <ProgressBar pct={data.completionPct} />
            </div>

            {/* Upload error */}
            {uploadError && (
              <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{uploadError}</p>
              </div>
            )}

            {/* Document cards */}
            <div className="space-y-4">
              {requiredDocs.map((docType) => {
                const doc = DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES]
                if (!doc) return null
                const uploaded = data.documents.find((d) => d.docType === docType)
                const isUploading = uploadingDoc === docType
                const wasJustUploaded = justUploaded === docType
                const hasFormDefinition = !!getFormDefinition(docType)

                return (
                  <DocumentCard
                    key={docType}
                    docType={docType}
                    label={doc.label}
                    description={doc.description}
                    instructions={doc.instructions}
                    uploaded={!!uploaded}
                    uploadedFileName={uploaded?.fileName ?? undefined}
                    isUploading={isUploading}
                    wasJustUploaded={wasJustUploaded}
                    hasFormDefinition={hasFormDefinition}
                    onFileSelect={(file) => handleUpload(docType, file)}
                    onFillOnline={() => setActiveFormFill(docType)}
                  />
                )
              })}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground mt-10 mb-6 px-4">
              Your documents are encrypted and sent directly to {data.businessName}.
              <br />
              Powered by Filezy
            </p>
          </>
        )}
      </div>
    </Shell>
  )
}

function Shell({
  children,
  brandLogoUrl,
  businessName,
}: {
  children: React.ReactNode
  brandLogoUrl?: string | null
  businessName?: string | null
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={businessName ?? ""}
              className="h-10 max-w-[200px] object-contain"
            />
          ) : (
            <>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">
                Filezy
              </span>
            </>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: 'var(--brand-primary, #136334)' }}
      />
    </div>
  )
}

function ErrorCard({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode
  title: string
  message: string
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      {icon}
      <h1 className="text-xl font-bold text-foreground mt-4 mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-xs">{message}</p>
    </div>
  )
}

const tipIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FileCheck, PenLine, Camera, Sun, Eye, AlertCircle, Calendar,
}

function DocumentCard({
  docType,
  label,
  description,
  instructions,
  uploaded,
  uploadedFileName,
  isUploading,
  wasJustUploaded,
  hasFormDefinition,
  onFileSelect,
  onFillOnline,
}: {
  docType: string
  label: string
  description: string
  instructions: string
  uploaded: boolean
  uploadedFileName?: string
  isUploading: boolean
  wasJustUploaded: boolean
  hasFormDefinition: boolean
  onFileSelect: (file: File) => void
  onFillOnline: () => void
}) {
  const inputId = `file-${docType}`

  return (
    <div
      className={`rounded-2xl border bg-card p-5 transition-all duration-300 ${
        uploaded
          ? "border-primary/30 bg-primary/[0.03]"
          : "border-border hover:border-primary/20"
      } ${wasJustUploaded ? "ring-2 ring-primary/30 scale-[1.01]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {uploaded ? (
              <CheckCircle2
                className="h-5 w-5 shrink-0"
                style={{ color: 'var(--brand-primary, #136334)' }}
              />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            <h3 className="font-semibold text-foreground text-[15px]">
              {label}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground ml-7">{description}</p>
        </div>
      </div>

      {!uploaded && (
        <p className="text-sm text-muted-foreground mt-3 ml-7 leading-relaxed">
          {instructions}
        </p>
      )}

      {/* Validation Tips — only show for docs not yet uploaded */}
      {!uploaded && getValidationTips(docType).length > 0 && (
        <div className="mt-3 ml-7 space-y-1.5">
          {getValidationTips(docType).map((tip, i) => {
            const Icon = tipIcons[tip.icon] || FileCheck
            return (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{tip.text}</span>
              </div>
            )
          })}
        </div>
      )}

      {uploaded && uploadedFileName && (
        <div className="mt-3 ml-7 flex items-center gap-2 text-sm" style={{ color: 'var(--brand-primary, #136334)' }}>
          <FileText className="h-4 w-4" />
          <span className="truncate">{uploadedFileName}</span>
        </div>
      )}

      <div className="mt-4 ml-7">
        {uploaded ? (
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4" />
            Replace file
            <input
              id={inputId}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
                e.target.value = ""
              }}
            />
          </label>
        ) : isUploading ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </div>
        ) : hasFormDefinition ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onFillOnline}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white cursor-pointer active:scale-[0.98] transition-all"
              style={{ backgroundColor: 'var(--brand-primary, #136334)' }}
            >
              <PenLine className="h-4 w-4" />
              Fill out online
            </button>
            <label
              htmlFor={inputId}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground cursor-pointer hover:bg-accent active:scale-[0.98] transition-all"
            >
              <Camera className="h-4 w-4" />
              Upload file instead
              <input
                id={inputId}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFileSelect(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white cursor-pointer active:scale-[0.98] transition-all"
            style={{ backgroundColor: 'var(--brand-primary, #136334)' }}
          >
            <Camera className="h-4 w-4" />
            Take photo or choose file
            <input
              id={inputId}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
                e.target.value = ""
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}
