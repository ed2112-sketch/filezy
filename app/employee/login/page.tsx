"use client"

import { useState } from "react"
import { FileText, Mail, Loader2, CheckCircle2 } from "lucide-react"

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/employee/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || "Something went wrong.")
        setStatus("error")
        return
      }

      setStatus("sent")
    } catch {
      setErrorMsg("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#136334] flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Filezy
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {status === "sent" ? (
          <div className="flex flex-col items-center text-center py-16 px-4">
            <div className="rounded-full bg-[#136334]/10 p-6 mb-6">
              <CheckCircle2 className="h-12 w-12 text-[#136334]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground max-w-sm">
              We sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Click the link in the email to access your portal.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              The link expires in 15 minutes.
            </p>
            <button
              onClick={() => {
                setStatus("idle")
                setEmail("")
              }}
              className="mt-6 text-sm font-medium text-[#136334] hover:underline cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="py-12 px-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-[#136334]/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-[#136334]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Employee Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to view your documents
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
              Enter your email address and we will send you a secure sign-in
              link. No password required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#136334]/30 focus:border-[#136334]"
                />
              </div>

              {status === "error" && errorMsg && (
                <p className="text-sm text-destructive">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-[#136334] px-4 py-3 text-sm font-medium text-white cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send sign-in link"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-10">
              Powered by Filezy
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
