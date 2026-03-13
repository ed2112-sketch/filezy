"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { SignatureData } from "@/lib/forms/types"

// Re-export for consumers who import from this module directly
export type { SignatureData }

export type SignaturePadProps = {
  onSign: (data: SignatureData) => void
  onCancel?: () => void
  signerName?: string
  loading?: boolean
}

type Mode = "typed" | "drawn"

type Stroke = { x: number; y: number }[]

const CONSENT_TEXT =
  "I agree this electronic signature is legally binding."

export function SignaturePad({
  onSign,
  onCancel,
  signerName = "",
  loading = false,
}: SignaturePadProps) {
  const [mode, setMode] = useState<Mode>("typed")
  const [typedText, setTypedText] = useState(signerName)
  const [consent, setConsent] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [canvasHasContent, setCanvasHasContent] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)

  // ── Canvas helpers ────────────────────────────────────────────────────────

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext("2d")
  }, [])

  const redrawCanvas = useCallback(
    (strokeList: Stroke[]) => {
      const canvas = canvasRef.current
      const ctx = getCtx()
      if (!canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Baseline guide
      ctx.save()
      ctx.strokeStyle = "#d1d5db"
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(16, canvas.height - 32)
      ctx.lineTo(canvas.width - 16, canvas.height - 32)
      ctx.stroke()
      ctx.restore()

      // Draw strokes
      ctx.strokeStyle = "#1a1a1a"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (const stroke of strokeList) {
        if (stroke.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y)
        }
        ctx.stroke()
      }
    },
    [getCtx]
  )

  // Initialise canvas dimensions on mount and container resize
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const observer = new ResizeObserver(() => {
      const { width } = container.getBoundingClientRect()
      canvas.width = width
      canvas.height = 150
      redrawCanvas(strokes)
    })

    observer.observe(container)
    // Trigger once immediately
    const { width } = container.getBoundingClientRect()
    canvas.width = width
    canvas.height = 150
    redrawCanvas(strokes)

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw whenever strokes change
  useEffect(() => {
    redrawCanvas(strokes)
  }, [strokes, redrawCanvas])

  // ── Pointer event handlers ────────────────────────────────────────────────

  const getPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    []
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      isDrawing.current = true
      const pt = getPoint(e)
      setCurrentStroke([pt])
    },
    [getPoint]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return
      const pt = getPoint(e)
      setCurrentStroke((prev) => {
        if (!prev) return [pt]
        const next = [...prev, pt]

        // Live draw the latest segment directly for performance
        const ctx = getCtx()
        if (ctx && prev.length > 0) {
          ctx.strokeStyle = "#1a1a1a"
          ctx.lineWidth = 2
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.beginPath()
          ctx.moveTo(prev[prev.length - 1].x, prev[prev.length - 1].y)
          ctx.lineTo(pt.x, pt.y)
          ctx.stroke()
        }

        return next
      })
    },
    [getPoint, getCtx]
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    setCurrentStroke((current) => {
      if (current && current.length > 0) {
        setStrokes((prev) => {
          const next = [...prev, current]
          setCanvasHasContent(true)
          return next
        })
      }
      return null
    })
  }, [])

  // ── Clear / Undo ──────────────────────────────────────────────────────────

  const clearCanvas = useCallback(() => {
    setStrokes([])
    setCurrentStroke(null)
    setCanvasHasContent(false)
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      redrawCanvas([]) // redraws baseline
    }
  }, [getCtx, redrawCanvas])

  const undoStroke = useCallback(() => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1)
      if (next.length === 0) setCanvasHasContent(false)
      return next
    })
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────

  const canSign =
    consent &&
    (mode === "typed" ? typedText.trim().length > 0 : canvasHasContent)

  const handleSign = useCallback(() => {
    if (!canSign) return

    if (mode === "typed") {
      onSign({
        type: "typed",
        value: typedText.trim(),
        consentGiven: true,
        consentText: CONSENT_TEXT,
      })
    } else {
      const canvas = canvasRef.current
      if (!canvas) return
      const dataUrl = canvas.toDataURL("image/png")
      onSign({
        type: "drawn",
        value: dataUrl,
        consentGiven: true,
        consentText: CONSENT_TEXT,
      })
    }
  }, [canSign, mode, typedText, onSign])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["typed", "drawn"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "border-b-2 border-[#136334] text-[#136334]"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {m === "typed" ? "Type to Sign" : "Draw to Sign"}
          </button>
        ))}
      </div>

      {/* Mode panels */}
      {mode === "typed" ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type your name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#136334]/50"
          />

          {/* Live preview */}
          <div className="min-h-[80px] rounded-md border border-gray-200 bg-gray-50 px-4 py-3 flex items-center">
            {typedText.trim() ? (
              <span
                className="text-gray-900 leading-none select-none"
                style={{ fontFamily: "'Dancing Script', cursive", fontSize: 36 }}
              >
                {typedText}
              </span>
            ) : (
              <span className="text-gray-400 text-sm italic">
                Your signature will appear here
              </span>
            )}
          </div>

          {typedText && (
            <button
              type="button"
              onClick={() => setTypedText("")}
              className="self-start text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div ref={containerRef} className="w-full">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full touch-none rounded-md cursor-crosshair"
              style={{
                border: "1px dashed #9ca3af",
                display: "block",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
            {strokes.length > 0 && (
              <button
                type="button"
                onClick={undoStroke}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Undo
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Draw your signature above using mouse or touch.
          </p>
        </div>
      )}

      {/* Consent */}
      <label className="flex items-start gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#136334]"
        />
        <span className="text-sm text-gray-600">{CONSENT_TEXT}</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSign}
          disabled={!canSign || loading}
          className={[
            "flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-colors",
            canSign && !loading
              ? "bg-[#136334] hover:bg-[#0f4f28] cursor-pointer"
              : "bg-gray-300 cursor-not-allowed",
          ].join(" ")}
        >
          {loading ? "Signing…" : "Sign Document"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
