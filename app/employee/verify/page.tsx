"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle, FileText } from "lucide-react"

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"verifying" | "error">("verifying")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!token) {
      setErrorMsg("No verification token provided.")
      setStatus("error")
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/employee/verify?token=${token}`)

        if (!res.ok) {
          const data = await res.json()
          setErrorMsg(
            data.error || "This link is invalid or has expired."
          )
          setStatus("error")
          return
        }

        router.push("/employee/portal")
      } catch {
        setErrorMsg("Something went wrong. Please try again.")
        setStatus("error")
      }
    }

    verify()
  }, [token, router])

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#136334]" />
        <p className="mt-4 text-muted-foreground">
          Verifying your link...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center py-16 px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h1 className="text-xl font-bold text-foreground mt-4 mb-2">
        Link Expired
      </h1>
      <p className="text-muted-foreground max-w-xs mb-6">{errorMsg}</p>
      <a
        href="/employee/login"
        className="inline-flex items-center gap-2 rounded-xl bg-[#136334] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        Request a new link
      </a>
    </div>
  )
}

export default function EmployeeVerifyPage() {
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
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#136334]" />
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  )
}
