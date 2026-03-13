"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { getFormDefinition } from "@/lib/forms"
import type { SignatureData } from "@/lib/forms"
import { generateSignedPDF } from "@/lib/forms/pdf-generator"
import { FormRenderer } from "@/components/forms/form-renderer"
import { SignaturePad } from "@/components/signature/signature-pad"

type FormFillFlowProps = {
  docType: string
  token: string
  employeeName: string
  onComplete: (fileName: string) => void
  onCancel: () => void
}

type Step = "form" | "signature" | "submitting"

type SubmitStatus = "generating" | "uploading" | "signing"

export function FormFillFlow({
  docType,
  token,
  employeeName,
  onComplete,
  onCancel,
}: FormFillFlowProps) {
  const definition = getFormDefinition(docType)

  const [step, setStep] = useState<Step>("form")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("generating")
  const [error, setError] = useState<string | null>(null)

  if (!definition) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No form definition found for this document type.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm text-primary underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const totalSteps = definition.requiresSignature ? 3 : 2
  const currentStepNumber = step === "form" ? 1 : step === "signature" ? 2 : totalSteps

  async function handleFormSubmit(data: Record<string, string>) {
    setFormData(data)
    if (definition!.requiresSignature) {
      setStep("signature")
    } else {
      await submitFlow(data, undefined)
    }
  }

  async function handleSign(signatureData: SignatureData) {
    await submitFlow(formData, signatureData)
  }

  async function submitFlow(
    data: Record<string, string>,
    signatureData: SignatureData | undefined
  ) {
    setStep("submitting")
    setError(null)

    try {
      // Step 1: Generate PDF
      setSubmitStatus("generating")
      const pdfBlob = await generateSignedPDF({
        docType,
        formData: data,
        signature: signatureData,
        employeeName,
      })

      // Step 2: Upload PDF
      setSubmitStatus("uploading")
      const fileName = `${docType.toLowerCase()}-signed.pdf`
      const file = new File([pdfBlob], fileName, { type: "application/pdf" })
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("docType", docType)

      const res = await fetch(`/api/upload/${token}`, {
        method: "POST",
        body: formDataUpload,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.error === "file_too_large") {
          throw new Error("The generated PDF is too large. Please try again.")
        } else if (err.error === "invalid_file_type") {
          throw new Error("Upload failed: invalid file type.")
        } else {
          throw new Error("Upload failed. Check your connection and try again.")
        }
      }

      const result = await res.json()
      const documentId: string | undefined = result.documentId

      // Step 3: Record signature (only if we have a documentId and signatureData)
      if (documentId && signatureData) {
        setSubmitStatus("signing")
        await fetch(`/api/documents/${documentId}/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureData, uploadToken: token }),
        })
      }

      onComplete(fileName)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
      // Return to the appropriate step
      setStep(definition!.requiresSignature && signatureData ? "signature" : "form")
    }
  }

  // ── Submitting state ──────────────────────────────────────────────────────

  if (step === "submitting") {
    const statusText =
      submitStatus === "generating"
        ? "Generating PDF..."
        : submitStatus === "uploading"
          ? "Uploading..."
          : "Recording signature..."

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{statusText}</p>
      </div>
    )
  }

  // ── Step indicator ────────────────────────────────────────────────────────

  const stepLabel =
    step === "form"
      ? `Step 1 of ${totalSteps}: Fill out form`
      : `Step 2 of ${totalSteps}: Sign document`

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-6 px-1">
        <p className="text-sm font-medium text-primary mb-1">{stepLabel}</p>
        <h2 className="text-xl font-bold text-foreground">{definition.title}</h2>
        {definition.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {definition.description}
          </p>
        )}

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === currentStepNumber
                  ? "w-6 bg-primary"
                  : i + 1 < currentStepNumber
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Step content */}
      {step === "form" && (
        <FormRenderer
          definition={definition}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          submitLabel={
            definition.requiresSignature ? "Continue to Signature" : "Submit"
          }
        />
      )}

      {step === "signature" && (
        <div>
          <SignaturePad
            onSign={handleSign}
            onCancel={() => setStep("form")}
            signerName={employeeName}
          />
        </div>
      )}
    </div>
  )
}
