"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, FileText, UserPlus } from "lucide-react"

type BusinessInfo = {
  businessName: string
  brandLogoUrl: string | null
  brandPrimaryColor: string | null
  brandAccentColor: string | null
  requiredDocTypes: { id: string; label: string; description: string }[]
}

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; data: BusinessInfo }
  | { kind: "not_found" }
  | { kind: "submitting"; data: BusinessInfo }
  | { kind: "error"; message: string }

export default function SelfOnboardPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [state, setState] = useState<PageState>({ kind: "loading" })
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch(`/api/self-onboard/${slug}`)
        if (!res.ok) {
          setState({ kind: "not_found" })
          return
        }
        const data: BusinessInfo = await res.json()
        setState({ kind: "ready", data })
      } catch {
        setState({ kind: "not_found" })
      }
    }
    fetchBusiness()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (state.kind !== "ready") return
    const data = state.data

    if (!name.trim() || !email.trim()) {
      setSubmitError("Name and email are required.")
      return
    }

    setState({ kind: "submitting", data })

    try {
      const res = await fetch(`/api/self-onboard/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setSubmitError(err.error || "Something went wrong. Please try again.")
        setState({ kind: "ready", data })
        return
      }

      const result = await res.json()
      // Extract the token from the uploadUrl and redirect
      const token = result.uploadUrl.split("/upload/")[1]
      router.push(`/upload/${token}`)
    } catch {
      setSubmitError("Something went wrong. Please try again.")
      setState({ kind: "ready", data })
    }
  }

  if (state.kind === "loading") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#136334]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </Shell>
    )
  }

  if (state.kind === "not_found") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center py-16 px-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold text-foreground mt-4 mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground max-w-xs">
            This onboarding link is not available. Self-onboarding may be
            disabled or the link may be incorrect.
          </p>
        </div>
      </Shell>
    )
  }

  if (state.kind === "error") {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center py-16 px-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold text-foreground mt-4 mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground max-w-xs">{state.message}</p>
        </div>
      </Shell>
    )
  }

  const data = state.kind === "submitting" ? state.data : state.data
  const isSubmitting = state.kind === "submitting"
  const primaryColor = data.brandPrimaryColor || "#136334"

  return (
    <Shell brandLogoUrl={data.brandLogoUrl} businessName={data.businessName}>
      <div
        style={
          {
            "--brand-primary": primaryColor,
            "--brand-accent": data.brandAccentColor || "#36c973",
          } as React.CSSProperties
        }
      >
        {/* Header */}
        <div className="px-1 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <UserPlus className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Get Started
              </h1>
              <p className="text-sm text-muted-foreground">
                {data.businessName}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Fill in your information below to begin your onboarding. You will
            then be asked to upload the required documents.
          </p>
        </div>

        {/* Required docs preview */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Documents you will need
          </h2>
          <div className="space-y-2">
            {data.requiredDocTypes.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <FileText
                  className="h-4 w-4 shrink-0"
                  style={{ color: primaryColor }}
                />
                <span className="text-sm text-muted-foreground">
                  {doc.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[--brand-primary]/30 focus:border-[--brand-primary]"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[--brand-primary]/30 focus:border-[--brand-primary]"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Phone{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[--brand-primary]/30 focus:border-[--brand-primary]"
            />
          </div>

          {submitError && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium text-white cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting onboarding...
              </>
            ) : (
              "Continue to document upload"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Your information is encrypted and sent directly to{" "}
          {data.businessName}.
          <br />
          Powered by Filezy
        </p>
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
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={businessName ?? ""}
              className="h-10 max-w-[200px] object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt="Filezy"
              className="h-10 max-w-[200px] object-contain"
            />

          )}
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
