"use client"

import { useEffect, useState } from "react"

interface Props {
  slug: string
  pagePath: string
  title: string
}

const DURATIONS = [
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "3 days",   ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 days",   ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days",  ms: 30 * 24 * 60 * 60 * 1000 },
]

export default function ShareFileButton({ slug, pagePath, title }: Props) {
  const [open, setOpen] = useState(false)
  const [durationMs, setDurationMs] = useState<number>(DURATIONS[1]!.ms) // default 3 days
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function close() {
    setOpen(false)
    setShareUrl(null)
    setCopied(false)
    setError(null)
  }

  function stopProp(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/portal/admin/share-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pagePath, durationMs }),
      })
      if (!res.ok) {
        let msg = `Server returned ${res.status}`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) msg = data.error
        } catch {}
        setError(msg)
        setBusy(false)
        return
      }
      const data = (await res.json()) as { url: string; expiresAt: number }
      setShareUrl(data.url)
      setBusy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setBusy(false)
    }
  }

  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy automatically — select and copy manually.")
    }
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={(e) => { stopProp(e); setOpen(true) }}
        style={btnSubtle}
        title="Share this file"
        aria-label="Share this file"
      >
        Share
      </button>

      {open && (
        <div
          onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) close() }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
            fontFamily: "var(--font-exo2)",
          }}
        >
          <div
            onClick={stopProp}
            style={{
              background: "#111", border: "1px solid #2a2a2a", borderRadius: "12px",
              padding: "28px", width: "100%", maxWidth: "480px",
            }}
          >
            <h3 style={modalTitle}>Share &quot;{title}&quot;</h3>
            <p style={modalSub}>
              Anyone with the link can open this file until it expires. No sign-in required.
            </p>

            {!shareUrl && (
              <>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.ms}
                      type="button"
                      onClick={() => setDurationMs(d.ms)}
                      style={{
                        ...chipBase,
                        background: durationMs === d.ms ? "#E8147F" : "transparent",
                        color: durationMs === d.ms ? "#fff" : "#aaa",
                        borderColor: durationMs === d.ms ? "#E8147F" : "#333",
                        fontWeight: durationMs === d.ms ? 600 : 400,
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {error && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "14px" }}>{error}</p>
                )}

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={close} style={btnGhost}>Cancel</button>
                  <button onClick={generate} disabled={busy} style={btnPrimary}>
                    {busy ? "Generating…" : "Generate link"}
                  </button>
                </div>
              </>
            )}

            {shareUrl && (
              <>
                <div
                  style={{
                    background: "#1a1a1a", border: "1px solid #333", borderRadius: "6px",
                    padding: "10px 12px", marginBottom: "16px",
                    color: "#e5e7eb", fontSize: "0.78rem", wordBreak: "break-all", lineHeight: 1.5,
                  }}
                >
                  {shareUrl}
                </div>
                {error && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "12px" }}>{error}</p>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={close} style={btnGhost}>Done</button>
                  <button onClick={copy} style={btnPrimary}>
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const btnSubtle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#888",
  cursor: "pointer",
  fontSize: "0.65rem",
  padding: "3px 8px",
  fontFamily: "var(--font-exo2)",
  letterSpacing: "0.04em",
}
const modalTitle: React.CSSProperties = { color: "#fff", fontSize: "1rem", fontWeight: 700, margin: "0 0 8px" }
const modalSub: React.CSSProperties = { color: "#888", fontSize: "0.85rem", margin: "0 0 18px", lineHeight: 1.5 }
const btnGhost: React.CSSProperties = {
  background: "transparent", border: "1px solid #333", borderRadius: "6px",
  color: "#888", cursor: "pointer", fontSize: "0.85rem", padding: "9px 18px",
  fontFamily: "var(--font-exo2)",
}
const btnPrimary: React.CSSProperties = {
  background: "#E8147F", border: "none", borderRadius: "6px",
  color: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, padding: "9px 18px",
  fontFamily: "var(--font-exo2)",
}
const chipBase: React.CSSProperties = {
  border: "1px solid",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "0.78rem",
  cursor: "pointer",
  fontFamily: "var(--font-exo2)",
  letterSpacing: "0.02em",
}
