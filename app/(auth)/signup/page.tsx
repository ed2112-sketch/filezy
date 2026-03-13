"use client"

import { Suspense, useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { FileText, Briefcase, Calculator, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type WorkflowType = "EMPLOYER" | "ACCOUNTANT" | "STAFFING_AGENCY"

const WORKFLOW_OPTIONS: {
  value: WorkflowType
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    value: "EMPLOYER",
    label: "Employer",
    icon: <Briefcase className="h-6 w-6" />,
    description: "Onboard new hires with tax forms, direct deposit, and e-signatures",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    icon: <Calculator className="h-6 w-6" />,
    description: "Collect W-9s, payroll docs, and financial records from clients",
  },
  {
    value: "STAFFING_AGENCY",
    label: "Staffing Agency",
    icon: <Users className="h-6 w-6" />,
    description: "High-volume worker onboarding with bulk invites and tracking",
  },
]

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#136334]" /></div>}>
      <SignupContent />
    </Suspense>
  )
}

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [workflowType, setWorkflowType] = useState<WorkflowType>("EMPLOYER")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [referredByAccountantId, setReferredByAccountantId] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setReferredByAccountantId(ref)
  }, [searchParams])

  function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name || !email || !password || !businessName) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, businessName, workflowType, referredByAccountantId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      // Auto sign in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        // Account created but sign-in failed, redirect to login
        router.push("/login")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-xl border-0 shadow-sm">
      <CardHeader className="items-center space-y-4 pb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#136334]">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Create your account" : "Choose your workflow"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1
              ? "Get started with Filezy for your business"
              : "Select how you'll use Filezy"}
          </CardDescription>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#136334]" />
          <div className={`h-2 w-2 rounded-full ${step === 2 ? "bg-[#136334]" : "bg-gray-200"}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {step === 1 ? (
          <form onSubmit={handleContinue} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Acme Inc."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="rounded-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-lg bg-[#136334] text-white hover:bg-[#0f5029]"
            >
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {WORKFLOW_OPTIONS.map((option) => {
                const isSelected = workflowType === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWorkflowType(option.value)}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-[#136334] bg-[#136334]/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-[#136334] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-semibold text-sm ${
                            isSelected ? "text-[#136334]" : "text-[#141609]"
                          }`}
                        >
                          {option.label}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500 leading-snug">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-[#136334] flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep(1); setError("") }}
                className="flex-1 rounded-lg"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[#136334] text-white hover:bg-[#0f5029]"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#136334] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
