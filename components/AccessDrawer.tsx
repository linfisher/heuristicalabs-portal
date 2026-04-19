"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export interface AccessGrantRow {
  userId: string
  name: string
  email: string
  expiresAt: number
}

interface Props {
  slug: string
  projectName: string
  grants: AccessGrantRow[]
}

const DURATIONS = [
  { label: "24 hours", ms: 86_400_000 },
  { label: "3 days",   ms: 259_200_000 },
  { label: "7 days",   ms: 604_800_000 },
  { label: "30 days",  ms: 2_592_000_000 },
  { label: "90 days",  ms: 7_776_000_000 },
]

function status(expiresAt: number, now: number): "active" | "expiring" | "expired" {
  if (expiresAt <= now) return "expired"
  if (expiresAt <= now + 7 * 24 * 60 * 60 * 1000) return "expiring"
  return "active"
}

function fmtExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 86_400_000))
}

export function AccessDrawer({ slug, projectName, grants }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const now = Date.now()

  async function act(userId: string, body: Record<string, unknown>) {
    setBusy(userId)
    const res = await fetch("/portal/admin/project-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, userId, projectSlug: slug }),
    })
    setBusy(null)
    if (res.ok) router.refresh()
  }

  const STATUS_COLORS = {
    active:   { bg: "#0f2d0f", border: "#22c55e", text: "#22c55e" },
    expiring: { bg: "#2d2200", border: "#F5C418", text: "#F5C418" },
    expired:  { bg: "#2d0f0f", border: "#ef4444", text: "#ef4444" },
  }

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} style={toggleBtn}>
        {open ? "Hide Access" : `Access (${grants.length})`}
      </button>

      {open && (
        <div style={drawerStyle}>
          <div style={drawerHeader}>
            <strong style={{ color: "#F5C418", fontSize: "0.85rem" }}>
              Access to {projectName}
            </strong>
            <span style={{ color: "#555", fontSize: "0.75rem" }}>{grants.length} user{grants.length !== 1 ? "s" : ""}</span>
          </div>

          {grants.length === 0 ? (
            <p style={{ color: "#555", fontSize: "0.8rem", padding: "8px 0" }}>
              No users have access yet. Grant via the Admin Dashboard.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {grants.map((g) => {
                const s = status(g.expiresAt, now)
                const colors = STATUS_COLORS[s]
                const days = daysLeft(g.expiresAt, now)
                return (
                  <li key={g.userId} style={rowStyle}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.name}
                      </div>
                      <div style={{ color: "#666", fontSize: "0.7rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.email}
                      </div>
                      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                          borderRadius: "3px",
                          padding: "1px 6px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}>{s}</span>
                        <span style={{ color: colors.text, fontSize: "0.7rem" }}>
                          {s === "expired" ? `Expired ${fmtExpiry(g.expiresAt)}` : `${days}d · ${fmtExpiry(g.expiresAt)}`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                      <select
                        defaultValue=""
                        disabled={busy === g.userId}
                        onChange={(e) => {
                          const ms = Number(e.target.value)
                          if (ms) act(g.userId, { action: "extend", durationMs: ms })
                          e.currentTarget.value = ""
                        }}
                        style={selectStyle}
                        title="Extend access"
                      >
                        <option value="">Extend…</option>
                        {DURATIONS.map((d) => (
                          <option key={d.ms} value={d.ms}>+{d.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy === g.userId}
                        onClick={() => act(g.userId, { action: "revoke" })}
                        style={btnRevoke}
                      >
                        Revoke
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

const toggleBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
  fontFamily: "var(--font-exo2)",
}

const drawerStyle: React.CSSProperties = {
  marginTop: "12px",
  background: "#0d0d0d",
  border: "1px solid #1f1f1f",
  borderRadius: "8px",
  padding: "14px 16px",
  maxHeight: "50vh",
  overflowY: "auto",
}

const drawerHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #1a1a1a",
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid #151515",
}

const selectStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#aaa",
  fontSize: "0.7rem",
  padding: "4px 6px",
  fontFamily: "var(--font-exo2)",
}

const btnRevoke: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.7rem",
  padding: "4px 10px",
  fontFamily: "var(--font-exo2)",
}
