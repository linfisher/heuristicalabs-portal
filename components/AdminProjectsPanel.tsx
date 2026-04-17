"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ProjectEntry } from "@/lib/projects-registry"

export function AdminProjectsPanel({
  active,
  archived,
}: {
  active: ProjectEntry[]
  archived: ProjectEntry[]
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<string | null>(null)

  async function post(path: string, body: Record<string, string>) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return res
  }

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setError("")
    const res = await post("/portal/admin/projects/create", { name })
    setCreating(false)
    if (res.ok) {
      setName("")
      setShowModal(false)
      router.refresh()
    } else {
      const data = await res.json() as { error?: string }
      setError(data.error ?? "Failed to create project")
    }
  }

  async function handleArchive(slug: string) {
    setBusy(slug)
    await post("/portal/admin/projects/archive", { slug })
    setBusy(null)
    router.refresh()
  }

  async function handleRestore(slug: string) {
    setBusy(slug)
    await post("/portal/admin/projects/restore", { slug })
    setBusy(null)
    router.refresh()
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete project "${slug}"? This cannot be undone.`)) return
    setBusy(slug)
    await post("/portal/admin/projects/delete", { slug })
    setBusy(null)
    router.refresh()
  }

  return (
    <div style={{ marginBottom: "48px" }}>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, margin: 0, letterSpacing: "0.03em" }}>
          Projects
        </h2>
        <button
          onClick={() => { setShowModal(true); setError("") }}
          style={{
            backgroundColor: "#E8147F",
            border: "none",
            borderRadius: "4px",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            padding: "7px 16px",
          }}
        >
          + Add Project
        </button>
      </div>

      {/* Active projects */}
      <div style={{ border: "1px solid #1f1f1f", borderRadius: "8px", overflow: "hidden" }}>
        {active.length === 0 ? (
          <div style={{ padding: "20px 16px", color: "#444444", fontSize: "0.85rem" }}>
            No active projects.
          </div>
        ) : (
          active.map((p, i) => (
            <div
              key={p.slug}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: i < active.length - 1 ? "1px solid #1a1a1a" : "none",
                backgroundColor: "#111111",
              }}
            >
              <div>
                <div style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#444444", fontSize: "0.72rem", marginTop: "2px" }}>{p.slug}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  disabled={busy === p.slug}
                  onClick={() => handleArchive(p.slug)}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #333333",
                    borderRadius: "4px",
                    color: "#888888",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "4px 12px",
                    opacity: busy === p.slug ? 0.5 : 1,
                  }}
                >
                  Archive
                </button>
                {p.isCustom && (
                  <button
                    disabled={busy === p.slug}
                    onClick={() => handleDelete(p.slug)}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #3d1515",
                      borderRadius: "4px",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      padding: "4px 12px",
                      opacity: busy === p.slug ? 0.5 : 1,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Archived section */}
      {archived.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              background: "none",
              border: "none",
              color: "#555555",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "4px 0",
              letterSpacing: "0.04em",
            }}
          >
            {showArchived ? "▾" : "▸"} {archived.length} archived project{archived.length !== 1 ? "s" : ""}
          </button>

          {showArchived && (
            <div style={{ border: "1px solid #1a1a1a", borderRadius: "8px", overflow: "hidden", marginTop: "8px" }}>
              {archived.map((p, i) => (
                <div
                  key={p.slug}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: i < archived.length - 1 ? "1px solid #1a1a1a" : "none",
                    backgroundColor: "#0d0d0d",
                  }}
                >
                  <div>
                    <div style={{ color: "#666666", fontSize: "0.875rem", fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "#333333", fontSize: "0.72rem", marginTop: "2px" }}>{p.slug}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      disabled={busy === p.slug}
                      onClick={() => handleRestore(p.slug)}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid #1f3d1f",
                        borderRadius: "4px",
                        color: "#22c55e",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        padding: "4px 12px",
                        opacity: busy === p.slug ? 0.5 : 1,
                      }}
                    >
                      Restore
                    </button>
                    {p.isCustom && (
                      <button
                        disabled={busy === p.slug}
                        onClick={() => handleDelete(p.slug)}
                        style={{
                          backgroundColor: "transparent",
                          border: "1px solid #3d1515",
                          borderRadius: "4px",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: "4px 12px",
                          opacity: busy === p.slug ? 0.5 : 1,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "32px",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <h3 style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>
              New Project
            </h3>
            <p style={{ color: "#555555", fontSize: "0.8rem", margin: "0 0 24px" }}>
              Enter a name. The slug is auto-derived. Add pages later in code.
            </p>

            <input
              autoFocus
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
              style={{
                width: "100%",
                backgroundColor: "#1a1a1a",
                border: "1px solid #333333",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem",
                padding: "10px 12px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: error ? "8px" : "20px",
              }}
            />

            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.78rem", margin: "0 0 16px" }}>{error}</p>
            )}

            {name.trim() && (
              <p style={{ color: "#444444", fontSize: "0.72rem", margin: "-12px 0 16px" }}>
                slug: {name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #333333",
                  borderRadius: "6px",
                  color: "#888888",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "9px 18px",
                }}
              >
                Cancel
              </button>
              <button
                disabled={creating || !name.trim()}
                onClick={handleCreate}
                style={{
                  backgroundColor: creating || !name.trim() ? "#7a0a43" : "#E8147F",
                  border: "none",
                  borderRadius: "6px",
                  color: "#ffffff",
                  cursor: creating || !name.trim() ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "9px 18px",
                }}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
