"use client"

import { useState } from "react"
import { Copy, Check, Send, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HireActions({
  hireId,
  uploadUrl,
}: {
  hireId: string
  uploadUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const [resending, setResending] = useState(false)
  const [notifying, setNotifying] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  async function resendInvite() {
    setResending(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/hires/${hireId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_invite" }),
      })
      if (res.ok) {
        setMessage("Invite resent successfully.")
      } else {
        setMessage("Failed to resend invite.")
      }
    } catch {
      setMessage("Network error. Please try again.")
    } finally {
      setResending(false)
    }
  }

  async function notifyAccountant() {
    setNotifying(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/hires/${hireId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notify_accountant" }),
      })
      if (res.ok) {
        setMessage("Accountant notified successfully.")
      } else {
        setMessage("Failed to notify accountant.")
      }
    } catch {
      setMessage("Network error. Please try again.")
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload link */}
      <div className="flex items-center gap-2 bg-white rounded-xl border p-3">
        <Input
          readOnly
          value={uploadUrl}
          className="border-0 bg-transparent text-sm font-mono focus-visible:ring-0"
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
              Copy link
            </>
          )}
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={resending}
          onClick={resendInvite}
        >
          {resending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Resend invite
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={notifying}
          onClick={notifyAccountant}
        >
          {notifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Bell className="h-3.5 w-3.5" />
          )}
          Notify accountant now
        </Button>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
