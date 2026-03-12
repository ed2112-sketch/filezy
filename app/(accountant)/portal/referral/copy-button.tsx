"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({
  text,
  label,
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      size="sm"
      className="gap-2 shrink-0"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label ?? "Copy"}
        </>
      )}
    </Button>
  )
}
