"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Loader2, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FormData = {
  employeeName: string
  employeeEmail: string
  employeePhone: string
  position: string
  startDate: string
}

type SuccessResult = {
  hire: { id: string; employeeName: string }
  uploadUrl: string
}

export default function NewHirePage() {
  const [form, setForm] = useState<FormData>({
    employeeName: "",
    employeeEmail: "",
    employeePhone: "",
    position: "",
    startDate: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessResult | null>(null)
  const [copied, setCopied] = useState(false)

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.employeeName.trim()) {
      setError("Employee name is required.")
      return
    }

    if (!form.employeeEmail.trim() && !form.employeePhone.trim()) {
      setError("Please provide at least an email or phone number.")
      return
    }

    setSubmitting(true)

    try {
      const body: Record<string, string> = {
        employeeName: form.employeeName.trim(),
      }
      if (form.employeeEmail.trim()) body.employeeEmail = form.employeeEmail.trim()
      if (form.employeePhone.trim()) body.employeePhone = form.employeePhone.trim()
      if (form.position.trim()) body.position = form.position.trim()
      if (form.startDate) body.startDate = form.startDate

      const res = await fetch("/api/hires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong. Please try again.")
        setSubmitting(false)
        return
      }

      const data = await res.json()
      setSuccess(data)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.uploadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  function resetForm() {
    setForm({
      employeeName: "",
      employeeEmail: "",
      employeePhone: "",
      position: "",
      startDate: "",
    })
    setSuccess(null)
    setError(null)
    setCopied(false)
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/hires"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hires
        </Link>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              Hire created for {success.hire.employeeName}
            </h1>
            <p className="text-muted-foreground mb-6">
              We'll email them automatically, but you can share this link
              directly too.
            </p>

            {/* Upload link */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
              <Input
                readOnly
                value={success.uploadUrl}
                className="border-0 bg-transparent text-sm font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={copyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8">
              <Link href={`/hires/${success.hire.id}`}>
                <Button variant="outline">View hire details</Button>
              </Link>
              <Button
                onClick={resetForm}
                className="gap-2 bg-[#136334] hover:bg-[#136334]/90"
              >
                <Plus className="h-4 w-4" />
                Add another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Form state
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link
        href="/hires"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to hires
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Hire</h1>
        <p className="text-muted-foreground mt-1">
          Enter the new employee's details to generate their upload link.
        </p>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="employeeName">
                Employee Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeName"
                placeholder="Jane Smith"
                value={form.employeeName}
                onChange={(e) => update("employeeName", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeEmail">Employee Email</Label>
              <Input
                id="employeeEmail"
                type="email"
                placeholder="jane@example.com"
                value={form.employeeEmail}
                onChange={(e) => update("employeeEmail", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeePhone">Employee Phone</Label>
              <Input
                id="employeePhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.employeePhone}
                onChange={(e) => update("employeePhone", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              At least an email or phone number is needed to send the upload
              link.
            </p>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                placeholder="e.g. Server, Office Manager"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="rounded-xl"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl h-11"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Hire & Generate Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
