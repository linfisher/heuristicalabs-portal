"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"

type Duration = { label: string; chip: string; ms: number }

// "Set to:" chips for one existing grant. Clicking a chip turns it pink while
// it saves, then green once saved — no page reload.
export function GrantDurationChips({
  userId,
  projectSlug,
  projectName,
  durations,
  activeMs,
}: {
  userId: string
  projectSlug: string
  projectName: string
  durations: Duration[]
  activeMs: number
}) {
  const router = useRouter()
  const [selected, setSelected] = useState(activeMs)
  const [saving, setSaving] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => setSelected(activeMs), [activeMs])

  async function choose(ms: number) {
    if (saving !== null) return
    setSaving(ms)
    setFailed(false)
    try {
      const res = await fetch("/portal/admin/project-access", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend", userId, projectSlug, durationMs: ms }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSelected(ms)
      router.refresh()
    } catch {
      setFailed(true)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      <span style={{ color: "#666666", fontSize: "0.7rem", marginRight: "2px" }}>Set to:</span>
      {durations.map((d) => (
        <button
          key={d.ms}
          type="button"
          disabled={saving !== null}
          onClick={() => choose(d.ms)}
          title={`Set ${projectName} access to ${d.label}`}
          style={chipStyle(d.ms === saving ? "saving" : d.ms === selected ? "active" : "idle", saving !== null)}
        >
          {d.chip}
        </button>
      ))}
      {failed && <span style={{ color: "#ef4444", fontSize: "0.7rem" }}>Not saved - try again</span>}
    </div>
  )
}

function chipStyle(state: "idle" | "active" | "saving", locked: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "3px",
    color: "#aaaaaa",
    cursor: locked ? "wait" : "pointer",
    fontFamily: "inherit",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "2px 7px",
    whiteSpace: "nowrap",
    transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
  }
  if (state === "saving") return { ...base, backgroundColor: "#E8147F", border: "1px solid #E8147F", color: "#ffffff" }
  if (state === "active") return { ...base, backgroundColor: "#22c55e", border: "1px solid #22c55e", color: "#0a0a0a" }
  return base
}
