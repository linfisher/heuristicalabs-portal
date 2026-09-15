"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"

type Phase = "idle" | "busy" | "done" | "error"
type Tone = "neutral" | "pink" | "success" | "link"

// A dashboard button that saves in place: it visibly presses, shows a working
// label while the request runs, then a green done (or red failed) state, and
// refreshes the page data without navigating or scrolling.
export function AdminActionButton({
  endpoint,
  payload,
  json = false,
  label,
  busyLabel,
  doneLabel,
  errorLabel = "Failed - try again",
  tone = "neutral",
  fullWidth = false,
  title,
}: {
  endpoint: string
  payload: Record<string, string | number>
  json?: boolean
  label: string
  busyLabel: string
  doneLabel: string
  errorLabel?: string
  tone?: Tone
  fullWidth?: boolean
  title?: string
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("idle")
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (phase !== "done" && phase !== "error") return
    const t = setTimeout(() => setPhase("idle"), phase === "done" ? 2000 : 3500)
    return () => clearTimeout(t)
  }, [phase])

  async function run() {
    if (phase === "busy") return
    setPhase("busy")
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: json
          ? { Accept: "application/json", "Content-Type": "application/json" }
          : { Accept: "application/json" },
        body: json
          ? JSON.stringify(payload)
          : new URLSearchParams(Object.entries(payload).map(([k, v]) => [k, String(v)])),
      })
      if (!res.ok) throw new Error(String(res.status))
      setPhase("done")
      router.refresh()
    } catch {
      setPhase("error")
    }
  }

  const text =
    phase === "busy" ? busyLabel : phase === "done" ? doneLabel : phase === "error" ? errorLabel : label

  return (
    <button
      type="button"
      onClick={run}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={phase === "busy"}
      aria-busy={phase === "busy"}
      title={title}
      style={buttonStyle(tone, phase, pressed, fullWidth)}
    >
      {text}
    </button>
  )
}

const TONE_BASE: Record<Tone, { bg: string; border: string; text: string }> = {
  neutral: { bg: "#161616", border: "#333333", text: "#dddddd" },
  pink: { bg: "#E8147F", border: "#E8147F", text: "#ffffff" },
  success: { bg: "transparent", border: "#2a4a2a", text: "#22c55e" },
  link: { bg: "transparent", border: "transparent", text: "#888888" },
}

function buttonStyle(tone: Tone, phase: Phase, pressed: boolean, fullWidth: boolean): React.CSSProperties {
  const t = TONE_BASE[tone]
  const base: React.CSSProperties = {
    backgroundColor: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: "4px",
    color: t.text,
    cursor: phase === "busy" ? "wait" : "pointer",
    fontFamily: "inherit",
    fontSize: tone === "link" ? "0.7rem" : "0.75rem",
    fontWeight: tone === "link" ? 400 : 600,
    padding: tone === "link" ? "2px 4px" : "6px 12px",
    textDecoration: tone === "link" && phase === "idle" ? "underline" : "none",
    textUnderlineOffset: "2px",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    transform: pressed ? "scale(0.95)" : "scale(1)",
    transition: "transform 80ms ease, background-color 150ms ease, color 150ms ease, border-color 150ms ease, opacity 150ms ease",
  }
  if (phase === "busy") {
    return { ...base, backgroundColor: "#3a1623", border: "1px solid #E8147F", color: "#ffffff", opacity: 0.85 }
  }
  if (phase === "done") {
    return { ...base, backgroundColor: "#0f2d0f", border: "1px solid #22c55e", color: "#22c55e" }
  }
  if (phase === "error") {
    return { ...base, backgroundColor: "#2d0f0f", border: "1px solid #ef4444", color: "#ef4444" }
  }
  return base
}
