"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Save, CreditCard, Upload, Trash2, ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
]

type Settings = {
  name: string
  state: string
  accountantName: string
  accountantEmail: string
  plan: string
  brandLogoUrl: string | null
  brandPrimaryColor: string
  brandAccentColor: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Settings>({
    name: "",
    state: "",
    accountantName: "",
    accountantEmail: "",
    plan: "STARTER",
    brandLogoUrl: null,
    brandPrimaryColor: "",
    brandAccentColor: "",
  })

  // Branding state
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandSaved, setBrandSaved] = useState(false)
  const [brandError, setBrandError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoRemoving, setLogoRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business/settings")
        if (!res.ok) return
        const data = await res.json()
        setForm({
          name: data.name ?? "",
          state: data.state ?? "",
          accountantName: data.accountantName ?? "",
          accountantEmail: data.accountantEmail ?? "",
          plan: data.plan ?? "STARTER",
          brandLogoUrl: data.brandLogoUrl ?? null,
          brandPrimaryColor: data.brandPrimaryColor ?? "",
          brandAccentColor: data.brandAccentColor ?? "",
        })
      } catch {
        setError("Failed to load settings.")
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  function update(field: keyof Settings, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function updateBrand(field: "brandPrimaryColor" | "brandAccentColor", value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setBrandSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          state: form.state,
          accountantName: form.accountantName,
          accountantEmail: form.accountantEmail,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save settings.")
        return
      }

      setSaved(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleBrandSave(e: React.FormEvent) {
    e.preventDefault()
    setBrandSaving(true)
    setBrandError(null)
    setBrandSaved(false)

    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandPrimaryColor: form.brandPrimaryColor || null,
          brandAccentColor: form.brandAccentColor || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setBrandError(data.error ?? "Failed to save branding.")
        return
      }

      setBrandSaved(true)
    } catch {
      setBrandError("Network error. Please try again.")
    } finally {
      setBrandSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      setBrandError("Only JPG, PNG, and SVG files are allowed.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setBrandError("Logo must be under 2MB.")
      return
    }

    setLogoUploading(true)
    setBrandError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/business/logo", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setBrandError(data.error ?? "Failed to upload logo.")
        return
      }

      const data = await res.json()
      setForm((prev) => ({ ...prev, brandLogoUrl: data.url }))
    } catch {
      setBrandError("Network error. Please try again.")
    } finally {
      setLogoUploading(false)
      // Reset input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleLogoRemove() {
    setLogoRemoving(true)
    setBrandError(null)

    try {
      const res = await fetch("/api/business/logo", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setBrandError(data.error ?? "Failed to remove logo.")
        return
      }
      setForm((prev) => ({ ...prev, brandLogoUrl: null }))
    } catch {
      setBrandError("Network error. Please try again.")
    } finally {
      setLogoRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const planLabels: Record<string, string> = {
    STARTER: "Starter",
    GROWTH: "Growth",
    PRO: "Pro",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business details and preferences.
        </p>
      </div>

      {/* Business settings form */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Business Details</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a state...</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Separator />

            <h2 className="font-semibold">Accountant Information</h2>

            <div className="space-y-2">
              <Label htmlFor="accountantName">Accountant Name</Label>
              <Input
                id="accountantName"
                placeholder="e.g. John Smith, CPA"
                value={form.accountantName}
                onChange={(e) => update("accountantName", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountantEmail">Accountant Email</Label>
              <Input
                id="accountantEmail"
                type="email"
                placeholder="accountant@example.com"
                value={form.accountantEmail}
                onChange={(e) => update("accountantEmail", e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Completed hire documents will be sent to this email.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {saved && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                Settings saved successfully.
              </div>
            )}

            <Button
              type="submit"
              disabled={saving}
              className="gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Branding section */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-1">Branding</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Customize how your business appears on the employee upload page.
          </p>

          {/* Logo upload */}
          <div className="space-y-3 mb-6">
            <Label>Business Logo</Label>
            <div className="flex items-center gap-4">
              {/* Logo preview / placeholder */}
              <div className="w-20 h-20 rounded-xl border border-dashed border-input bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.brandLogoUrl ? (
                  <Image
                    src={form.brandLogoUrl}
                    alt="Business logo"
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  disabled={logoUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </>
                  )}
                </Button>
                {form.brandLogoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={logoRemoving}
                    onClick={handleLogoRemove}
                  >
                    {logoRemoving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </>
                    )}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or SVG — max 2MB
                </p>
              </div>
            </div>
          </div>

          <Separator className="mb-5" />

          {/* Brand colors */}
          <form onSubmit={handleBrandSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandPrimaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-input flex-shrink-0"
                    style={{
                      backgroundColor: form.brandPrimaryColor || "#136334",
                    }}
                  />
                  <Input
                    id="brandPrimaryColor"
                    value={form.brandPrimaryColor}
                    onChange={(e) => updateBrand("brandPrimaryColor", e.target.value)}
                    placeholder="#136334"
                    className="rounded-xl font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandAccentColor">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-input flex-shrink-0"
                    style={{
                      backgroundColor: form.brandAccentColor || "#36c973",
                    }}
                  />
                  <Input
                    id="brandAccentColor"
                    value={form.brandAccentColor}
                    onChange={(e) => updateBrand("brandAccentColor", e.target.value)}
                    placeholder="#36c973"
                    className="rounded-xl font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {brandError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {brandError}
              </div>
            )}

            {brandSaved && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                Branding saved successfully.
              </div>
            )}

            <Button
              type="submit"
              disabled={brandSaving}
              className="gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
            >
              {brandSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Branding
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Plan section */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Current Plan</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/15">
                  {planLabels[form.plan] ?? form.plan}
                </Badge>
                {form.plan === "STARTER" && (
                  <span className="text-sm text-muted-foreground">
                    Pay-per-onboarding
                  </span>
                )}
                {form.plan === "GROWTH" && (
                  <span className="text-sm text-muted-foreground">
                    25 included onboardings/mo
                  </span>
                )}
                {form.plan === "PRO" && (
                  <span className="text-sm text-muted-foreground">
                    75 included onboardings/mo
                  </span>
                )}
              </div>
            </div>
            {form.plan !== "PRO" && (
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
