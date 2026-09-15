"use client"

import { useState } from "react"
import type React from "react"

type Project = { slug: string; name: string }
type Duration = { label: string; chip: string; ms: number }

export function AddUserForm({
  projects,
  durations,
  defaultDurationMs,
}: {
  projects: Project[]
  durations: Duration[]
  defaultDurationMs: number
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const ready = email.includes("@") && checked.size > 0

  function toggle(slug: string, on: boolean) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (on) next.add(slug)
      else next.delete(slug)
      return next
    })
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setOpen((o) => !o)} style={open ? btnCancel : btnAdd}>
          {open ? "Cancel" : "+ Add User"}
        </button>
      </div>

      {open && (
        <form action="/portal/admin/invite" method="POST" style={panel}>
          <label style={labelStyle} htmlFor="add-user-email">Email</label>
          <input
            id="add-user-email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            style={inputStyle}
          />

          <span style={labelStyle}>Projects</span>
          <div style={checkList}>
            {projects.map((p) => (
              <label key={p.slug} style={{ display: "flex", alignItems: "center", gap: "6px", color: checked.has(p.slug) ? "#ffffff" : "#cccccc", fontSize: "0.8rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="projectSlug"
                  value={p.slug}
                  checked={checked.has(p.slug)}
                  onChange={(e) => toggle(p.slug, e.target.checked)}
                  style={{ accentColor: "#E8147F" }}
                />
                {p.name}
              </label>
            ))}
          </div>

          <label style={labelStyle} htmlFor="add-user-duration">Access length</label>
          <select id="add-user-duration" name="durationMs" defaultValue={defaultDurationMs} style={inputStyle}>
            {durations.map((d) => (
              <option key={d.ms} value={d.ms}>{d.label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!ready}
            style={{
              ...btnSend,
              backgroundColor: ready ? "#E8147F" : "#3a1623",
              color: ready ? "#ffffff" : "#8a8a8a",
              cursor: ready ? "pointer" : "not-allowed",
            }}
          >
            Send Invite
          </button>
          <p style={{ color: "#777777", fontSize: "0.72rem", margin: 0 }}>
            They get an email invite to create their sign-in. Access starts now. You get a copy of the email.
          </p>
        </form>
      )}
    </div>
  )
}

const btnAdd: React.CSSProperties = {
  backgroundColor: "#E8147F",
  border: "none",
  borderRadius: "6px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "8px 16px",
}

const btnCancel: React.CSSProperties = {
  ...btnAdd,
  backgroundColor: "transparent",
  border: "1px solid #333333",
  color: "#aaaaaa",
}

const panel: React.CSSProperties = {
  marginTop: "10px",
  background: "#0d0d0d",
  border: "1px solid #1f1f1f",
  borderRadius: "8px",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxWidth: "420px",
  marginLeft: "auto",
}

const labelStyle: React.CSSProperties = {
  color: "#888888",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "0.85rem",
  padding: "7px 10px",
  width: "100%",
}

const checkList: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  padding: "8px 10px",
  maxHeight: "220px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
}

const btnSend: React.CSSProperties = {
  border: "none",
  borderRadius: "4px",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "8px 14px",
  marginTop: "4px",
  transition: "background-color 0.15s ease, color 0.15s ease",
}
