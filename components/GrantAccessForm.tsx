"use client"

import { useMemo, useState } from "react"
import type React from "react"

type Project = { slug: string; name: string }
type Duration = { label: string; chip: string; ms: number }

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
  const initialSet = useMemo(() => new Set(initialCheckedSlugs), [initialCheckedSlugs])
  const [checked, setChecked] = useState<Set<string>>(() => new Set(initialCheckedSlugs))
  const [durationMs, setDurationMs] = useState<number>(initialDurationMs)

  const isDirty = useMemo(() => {
    if (durationMs !== initialDurationMs) return true
    if (checked.size !== initialSet.size) return true
    for (const slug of checked) if (!initialSet.has(slug)) return true
    return false
  }, [checked, durationMs, initialDurationMs, initialSet])

  function toggle(slug: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(slug)
      else next.delete(slug)
      return next
    })
  }

  return (
    <form
      action="/portal/admin/direct-grant"
      method="POST"
      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
    >
      <input type="hidden" name="userId" value={userId} />
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "4px",
          padding: "6px 8px",
          maxHeight: "220px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {projects.map((p) => {
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
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="projectSlug"
                value={p.slug}
                checked={isChecked}
                onChange={(e) => toggle(p.slug, e.target.checked)}
                style={{ accentColor: "#E8147F" }}
              />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
            </label>
          )
        })}
        {projects.length === 0 && (
          <span style={{ color: "#555", fontSize: "0.7rem" }}>No active projects</span>
        )}
      </div>
      <select
        name="durationMs"
        style={selectStyle}
        value={durationMs}
        onChange={(e) => setDurationMs(Number(e.target.value))}
      >
        {durations.map((d) => (
          <option key={d.ms} value={d.ms}>
            {d.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!isDirty}
        style={{
          ...btnPrimary,
          backgroundColor: isDirty ? "#E8147F" : "#3a1623",
          color: isDirty ? "#ffffff" : "#8a8a8a",
          cursor: isDirty ? "pointer" : "not-allowed",
        }}
        title={isDirty ? "Apply changes" : "No changes to apply"}
      >
        Grant Now
      </button>
    </form>
  )
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

const btnPrimary: React.CSSProperties = {
  border: "none",
  borderRadius: "4px",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: "7px 14px",
  width: "100%",
  transition: "background-color 0.15s ease, color 0.15s ease",
}
