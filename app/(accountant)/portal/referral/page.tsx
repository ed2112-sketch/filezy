import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Link2, MousePointerClick, UserPlus, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CopyButton } from "./copy-button"

export default async function ReferralPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const accountant = await db.accountant.findUnique({
    where: { userId: session.user.id },
    include: { referralLink: true },
  })

  if (!accountant) redirect("/portal/join")

  const referralLink = accountant.referralLink
  const referralUrl = referralLink
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://filezy.com"}/r/${referralLink.slug}`
    : null

  const emailTemplate = `Hi [Client Name],

I wanted to introduce you to Filezy — a tool that makes collecting new hire paperwork effortless. Instead of chasing down W-4s, I-9s, and direct deposit forms, Filezy sends your new hires a simple link where they can upload everything digitally.

It saves us both time — your employees get set up faster, and I receive the documents I need without any back-and-forth.

You can sign up here: ${referralUrl ?? "[your referral link]"}

Let me know if you have any questions!

Best,
${accountant.name ?? "[Your Name]"}${accountant.firmName ? `\n${accountant.firmName}` : ""}`

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Link</h1>
        <p className="text-muted-foreground mt-1">
          Share your personal link to earn commissions on every referral
        </p>
      </div>

      {/* Stats */}
      {referralLink && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <MousePointerClick className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Link Clicks</p>
                  <p className="text-2xl font-bold">{referralLink.clicks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold">
                    {referralLink.conversions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referral link card */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="h-5 w-5 text-[#136334]" />
            <h2 className="text-lg font-semibold">Your Referral Link</h2>
          </div>
          {referralUrl ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 font-mono text-sm select-all">
                {referralUrl}
              </div>
              <CopyButton text={referralUrl} />
            </div>
          ) : (
            <p className="text-muted-foreground">
              No referral link found. Please contact support.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Email template */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-[#136334]" />
            <h2 className="text-lg font-semibold">Email Template</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Copy this pre-written email to send to your clients
          </p>
          <div className="relative">
            <div className="bg-muted/50 rounded-xl p-4 text-sm whitespace-pre-line leading-relaxed">
              {emailTemplate}
            </div>
            <div className="absolute top-3 right-3">
              <CopyButton text={emailTemplate} label="Copy Email" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
