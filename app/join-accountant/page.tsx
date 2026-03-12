"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccountantJoinPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [firmName, setFirmName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleSlugChange(value: string) {
    // Auto-format: lowercase, replace spaces with hyphens, strip invalid chars
    const formatted = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    setSlug(formatted)
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = "Name is required"
    if (!email.trim()) errors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address"
    if (!slug.trim()) errors.slug = "Referral slug is required"
    else if (slug.length < 3 || slug.length > 30)
      errors.slug = "Slug must be 3-30 characters"
    else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 3)
      errors.slug =
        "Slug must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/accountant/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          firmName: firmName.trim() || undefined,
          slug: slug.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Welcome to the Filezy Partner Program!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your account has been created. Log in to access your partner
              portal, referral link, and start earning commissions.
            </p>
            <Link href="/login">
              <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90 w-full">
                Go to Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#136334] flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Filezy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Join the Partner Program
          </h1>
          <p className="text-muted-foreground mt-2">
            Earn 20-30% commission on every client you refer to Filezy
          </p>
        </div>

        {/* Form */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="rounded-xl"
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@accounting.com"
                  className="rounded-xl"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name (optional)</Label>
                <Input
                  id="firmName"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Smith & Associates CPA"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Referral Slug</Label>
                <div className="flex items-center gap-0 rounded-xl border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                  <span className="bg-muted px-3 py-2 text-sm text-muted-foreground whitespace-nowrap border-r">
                    filezy.com/r/
                  </span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="jane-smith"
                    className="flex-1 px-3 py-2 text-sm bg-transparent outline-none"
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  3-30 characters. Lowercase letters, numbers, and hyphens only.
                </p>
                {fieldErrors.slug && (
                  <p className="text-sm text-destructive">{fieldErrors.slug}</p>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Join Partner Program"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already a partner?{" "}
          <Link
            href="/login"
            className="text-[#136334] font-medium hover:underline"
          >
            Log in to your portal
          </Link>
        </p>
      </div>
    </div>
  )
}
