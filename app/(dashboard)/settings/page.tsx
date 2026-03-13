"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

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
    plan: "FREE",
  })

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
          plan: data.plan ?? "FREE",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const planLabels: Record<string, string> = {
    FREE: "Free",
    STARTER: "Starter",
    PRO: "Pro",
    BUSINESS: "Business",
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
                {form.plan === "FREE" && (
                  <span className="text-sm text-muted-foreground">
                    1 hire per year
                  </span>
                )}
                {form.plan === "STARTER" && (
                  <span className="text-sm text-muted-foreground">
                    10 hires per year
                  </span>
                )}
                {(form.plan === "PRO" || form.plan === "BUSINESS") && (
                  <span className="text-sm text-muted-foreground">
                    Unlimited hires
                  </span>
                )}
              </div>
            </div>
            {form.plan !== "PRO" && form.plan !== "BUSINESS" && (
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
