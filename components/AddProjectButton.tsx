"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AddProjectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const slugPreview = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  async function submit() {
    if (!name.trim()) return
    setBusy(true)
    setError("")
    const res = await fetch("/portal/admin/projects/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setBusy(false)
    if (res.ok) {
      setName("")
      setOpen(false)
      router.refresh()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? "Failed to create project")
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError("") }}
        style={{
          background: "#E8147F",
          border: "none",
          borderRadius: "6px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          padding: "8px 16px",
          fontFamily: "var(--font-exo2)",
        }}
      >
        + Add Project
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              background: "#111",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "440px",
              fontFamily: "var(--font-exo2)",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>New Project</h3>
            <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 24px", lineHeight: 1.5 }}>
              Enter a name. The URL slug is derived automatically. You can add files next.
            </p>
            <input
              autoFocus
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit() }}
              style={{
                width: "100%",
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.9rem",
                padding: "10px 12px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: slugPreview ? "8px" : (error ? "8px" : "20px"),
                fontFamily: "inherit",
              }}
            />
            {slugPreview && (
              <p style={{ color: "#444", fontSize: "0.72rem", margin: "0 0 16px" }}>slug: {slugPreview}</p>
            )}
            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.78rem", margin: "0 0 16px" }}>{error}</p>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: "6px",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "9px 18px",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                disabled={busy || !name.trim()}
                onClick={submit}
                style={{
                  background: busy || !name.trim() ? "#7a0a43" : "#E8147F",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: busy || !name.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "9px 18px",
                  fontFamily: "inherit",
                }}
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
