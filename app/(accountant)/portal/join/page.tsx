"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AccountantJoinPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [firmName, setFirmName] = useState("")
  const [slug, setSlug] = useState("")

  const handleSlugChange = (value: string) => {
    // Only allow URL-safe characters
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/accountant/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, firmName, slug }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }

      router.push("/portal")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-[#136334] flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Join the Filezy Partner Program
          </h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Earn commissions by referring businesses to Filezy. Get up to 30%
            recurring revenue on every subscription.
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
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@smithcpa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                  id="firmName"
                  placeholder="Smith & Associates CPA"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Referral Slug</Label>
                <div className="flex items-center gap-0">
                  <span className="bg-muted px-3 py-2 rounded-l-xl text-sm text-muted-foreground border border-r-0 border-input">
                    filezy.com/r/
                  </span>
                  <Input
                    id="slug"
                    placeholder="smith-cpa"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="rounded-l-none rounded-r-xl"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, and hyphens only
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Join Partner Program
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tier info */}
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Commission Tiers
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Starter", rate: "20%", desc: "1-5 referrals" },
              { label: "Growth", rate: "25%", desc: "6-20 referrals" },
              { label: "Elite", rate: "30%", desc: "21+ referrals" },
            ].map((tier) => (
              <Card key={tier.label} className="rounded-xl border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-[#136334]">
                    {tier.rate}
                  </p>
                  <p className="text-sm font-medium mt-1">{tier.label}</p>
                  <p className="text-xs text-muted-foreground">{tier.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
