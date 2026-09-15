"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type React from "react"

type Project = { slug: string; name: string }
type Duration = { label: string; chip: string; ms: number }
type SaveState = "saving" | "saved" | "error"

// Grant Access saves as you change it: ticking a project grants it at the
// selected length, unticking revokes it, and changing the length re-applies it
// to every ticked project. Each project shows Saving / Saved inline.
export function GrantAccessForm({
  userId,
  projects,
  initialCheckedSlugs,
  initialDurationMs,
  durations,
}: {
  userId: string
  projects: Project[]
  initialCheckedSlugs: string[]
  initialDurationMs: number
  durations: Duration[]
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(() => new Set(initialCheckedSlugs))
  const [durationMs, setDurationMs] = useState<number>(initialDurationMs)
  const [status, setStatus] = useState<Record<string, SaveState>>({})
  const [durationNote, setDurationNote] = useState<SaveState | null>(null)
  // Each save rewrites this user's whole grant list in Clerk, so saves run one at a time.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const pending = useRef(0)

  // Pick up changes made elsewhere on the page (Set to chips, Revoke) once nothing is mid-save.
  const serverSig = [...initialCheckedSlugs].sort().join(",")
  useEffect(() => {
    if (pending.current === 0) setChecked(new Set(initialCheckedSlugs))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSig])

  function mark(slugs: string[], state: SaveState) {
    setStatus((prev) => {
      const next = { ...prev }
      for (const slug of slugs) next[slug] = state
      return next
    })
    if (state === "saved") {
      setTimeout(() => {
        setStatus((prev) => {
          const next = { ...prev }
          for (const slug of slugs) if (next[slug] === "saved") delete next[slug]
          return next
        })
      }, 2000)
    }
  }

  function enqueue(task: () => Promise<void>) {
    pending.current++
    queue.current = queue.current.then(task).finally(() => {
      pending.current--
    })
  }

  async function save(body: Record<string, unknown>) {
    const res = await fetch("/portal/admin/project-access", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    })
    if (!res.ok) throw new Error(String(res.status))
  }

  function toggle(slug: string, on: boolean) {
    const ms = durationMs
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(slug)
      else next.delete(slug)
      return next
    })
    mark([slug], "saving")
    enqueue(async () => {
      try {
        await save(on ? { action: "extend", projectSlug: slug, durationMs: ms } : { action: "revoke", projectSlug: slug })
        mark([slug], "saved")
        router.refresh()
      } catch {
        mark([slug], "error")
        setChecked((prev) => {
          const next = new Set(prev)
          if (on) next.delete(slug)
          else next.add(slug)
          return next
        })
      }
    })
  }

  function changeDuration(ms: number) {
    setDurationMs(ms)
    const slugs = [...checked]
    if (slugs.length === 0) return
    setDurationNote("saving")
    mark(slugs, "saving")
    enqueue(async () => {
      let allSaved = true
      for (const slug of slugs) {
        try {
          await save({ action: "extend", projectSlug: slug, durationMs: ms })
          mark([slug], "saved")
        } catch {
          allSaved = false
          mark([slug], "error")
        }
      }
      setDurationNote(allSaved ? "saved" : "error")
      router.refresh()
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={listBox}>
        {projects.map((p) => {
          const state = status[p.slug]
          const isChecked = checked.has(p.slug)
          return (
            <label
              key={p.slug}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: isChecked ? "#ffffff" : "#cccccc",
                fontSize: "0.75rem",
                cursor: state === "saving" ? "wait" : "pointer",
                borderRadius: "3px",
                padding: "2px 4px",
                backgroundColor: state === "saving" ? "rgba(232,20,127,0.18)" : "transparent",
                transition: "background-color 150ms ease",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={state === "saving"}
                onChange={(e) => toggle(p.slug, e.target.checked)}
                style={{ accentColor: "#E8147F" }}
              />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
              {state && (
                <span style={statusStyle(state)}>
                  {state === "saving" ? "Saving" : state === "saved" ? "Saved" : "Not saved"}
                </span>
              )}
            </label>
          )
        })}
        {projects.length === 0 && (
          <span style={{ color: "#555", fontSize: "0.7rem" }}>No active projects</span>
        )}
      </div>
      <select
        style={selectStyle}
        value={durationMs}
        onChange={(e) => changeDuration(Number(e.target.value))}
        aria-label="Access length"
      >
        {durations.map((d) => (
          <option key={d.ms} value={d.ms}>
            {d.label}
          </option>
        ))}
      </select>
      <span style={{ color: durationNote === "error" ? "#ef4444" : durationNote === "saving" ? "#E8147F" : "#666666", fontSize: "0.68rem" }}>
        {durationNote === "saving"
          ? "Updating access length..."
          : durationNote === "error"
            ? "Some changes did not save - try again"
            : "Changes save as you make them"}
      </span>
    </div>
  )
}

function statusStyle(state: SaveState): React.CSSProperties {
  const color = state === "saving" ? "#E8147F" : state === "saved" ? "#22c55e" : "#ef4444"
  return { color, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }
}

const listBox: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  padding: "6px 8px",
  maxHeight: "220px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
}

const selectStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#cccccc",
  fontSize: "0.8rem",
  padding: "5px 8px",
  width: "100%",
}
