"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ProjectEntry } from "@/lib/projects-registry"

type ConfirmIntent =
  | { kind: "archive"; slug: string; name: string }
  | { kind: "delete"; slug: string; name: string }
  | { kind: "restore"; slug: string; name: string }

export function AdminProjectsPanel({
  active,
  archived,
}: {
  active: ProjectEntry[]
  archived: ProjectEntry[]
}) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [confirm, setConfirm] = useState<ConfirmIntent | null>(null)

  async function post(path: string, body: Record<string, string>) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    setFormError("")
    const res = await post("/portal/admin/projects/create", { name: newName })
    setCreating(false)
    if (res.ok) {
      setNewName("")
      setShowAdd(false)
      router.refresh()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setFormError(data.error ?? "Failed to create project")
    }
  }

  async function handleRename(slug: string) {
    if (!renameValue.trim()) return
    setBusy(slug)
    const res = await post("/portal/admin/projects/rename", { slug, name: renameValue })
    setBusy(null)
    if (res.ok) {
      setRenaming(null)
      setRenameValue("")
      router.refresh()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setFormError(data.error ?? "Rename failed")
    }
  }

  async function runConfirmed() {
    if (!confirm) return
    const path =
      confirm.kind === "archive" ? "/portal/admin/projects/archive"
      : confirm.kind === "restore" ? "/portal/admin/projects/restore"
      : "/portal/admin/projects/delete"
    setBusy(confirm.slug)
    const res = await post(path, { slug: confirm.slug })
    setBusy(null)
    setConfirm(null)
    if (res.ok) router.refresh()
  }

  return (
    <div style={{ marginBottom: "48px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, margin: 0, letterSpacing: "0.03em" }}>
          Projects
        </h2>
        <button
          onClick={() => { setShowAdd(true); setFormError("") }}
          style={btnPrimaryInline}
        >
          + Add Project
        </button>
      </div>

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
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {renaming === p.slug ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(p.slug)
                        if (e.key === "Escape") { setRenaming(null); setRenameValue("") }
                      }}
                      style={renameInput}
                    />
                    <button
                      onClick={() => handleRename(p.slug)}
                      disabled={busy === p.slug || !renameValue.trim()}
                      style={btnSave}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setRenaming(null); setRenameValue("") }}
                      style={btnGhostSmall}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "#444444", fontSize: "0.72rem", marginTop: "2px" }}>{p.slug}</div>
                  </>
                )}
              </div>
              {renaming !== p.slug && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    disabled={busy === p.slug}
                    onClick={() => { setRenaming(p.slug); setRenameValue(p.name) }}
                    style={btnGhostSmall}
                  >
                    Rename
                  </button>
                  <button
                    disabled={busy === p.slug}
                    onClick={() => setConfirm({ kind: "archive", slug: p.slug, name: p.name })}
                    style={btnGhostSmall}
                  >
                    Archive
                  </button>
                  <button
                    disabled={busy === p.slug}
                    onClick={() => setConfirm({ kind: "delete", slug: p.slug, name: p.name })}
                    style={btnDangerSmall}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

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
                      onClick={() => setConfirm({ kind: "restore", slug: p.slug, name: p.name })}
                      style={btnRestore}
                    >
                      Restore
                    </button>
                    <button
                      disabled={busy === p.slug}
                      onClick={() => setConfirm({ kind: "delete", slug: p.slug, name: p.name })}
                      style={btnDangerSmall}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Project modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <h3 style={modalTitle}>New Project</h3>
          <p style={modalSubtitle}>
            Enter a name. A URL slug is derived automatically. You can add files later.
          </p>
          <input
            autoFocus
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
            style={{ ...modalInput, marginBottom: formError ? "8px" : "20px" }}
          />
          {formError && <p style={{ color: "#ef4444", fontSize: "0.78rem", margin: "0 0 16px" }}>{formError}</p>}
          {newName.trim() && (
            <p style={{ color: "#444444", fontSize: "0.72rem", margin: "-12px 0 16px" }}>
              slug: {slugifyPreview(newName)}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setShowAdd(false)} style={btnGhost}>Cancel</button>
            <button
              disabled={creating || !newName.trim()}
              onClick={handleCreate}
              style={{
                ...btnPrimary,
                backgroundColor: creating || !newName.trim() ? "#7a0a43" : "#E8147F",
                cursor: creating || !newName.trim() ? "not-allowed" : "pointer",
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </Modal>
      )}

      {/* Single confirm modal, reused for archive / delete / restore */}
      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <h3 style={modalTitle}>
            {confirm.kind === "archive" && `Archive "${confirm.name}"?`}
            {confirm.kind === "restore" && `Restore "${confirm.name}"?`}
            {confirm.kind === "delete" && `Delete "${confirm.name}"?`}
          </h3>
          <p style={modalSubtitle}>
            {confirm.kind === "archive" && "Users with existing grants will lose access until you restore it. Files on the server are kept."}
            {confirm.kind === "restore" && "This brings the project back to active. Users' existing grants resume."}
            {confirm.kind === "delete" && "This removes the project and deletes its files from the server. This cannot be undone."}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirm(null)} style={btnGhost}>Cancel</button>
            <button
              disabled={busy === confirm.slug}
              onClick={runConfirmed}
              style={confirm.kind === "delete" ? btnDangerPrimary : btnPrimary}
            >
              {confirm.kind === "archive" && "Archive"}
              {confirm.kind === "restore" && "Restore"}
              {confirm.kind === "delete" && "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "440px",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function slugifyPreview(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

const btnPrimaryInline: React.CSSProperties = {
  backgroundColor: "#E8147F",
  border: "none",
  borderRadius: "4px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: "7px 16px",
}

const btnGhostSmall: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #333333",
  borderRadius: "4px",
  color: "#aaaaaa",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnDangerSmall: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnRestore: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #1f3d1f",
  borderRadius: "4px",
  color: "#22c55e",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnSave: React.CSSProperties = {
  backgroundColor: "#E8147F",
  border: "none",
  borderRadius: "4px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "5px 14px",
}

const renameInput: React.CSSProperties = {
  flex: 1,
  backgroundColor: "#1a1a1a",
  border: "1px solid #333333",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "0.875rem",
  padding: "6px 10px",
  outline: "none",
}

const modalTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "1.1rem",
  fontWeight: 700,
  margin: "0 0 8px",
}

const modalSubtitle: React.CSSProperties = {
  color: "#888888",
  fontSize: "0.85rem",
  margin: "0 0 24px",
  lineHeight: 1.5,
}

const modalInput: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#1a1a1a",
  border: "1px solid #333333",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "0.9rem",
  padding: "10px 12px",
  outline: "none",
  boxSizing: "border-box",
}

const btnPrimary: React.CSSProperties = {
  backgroundColor: "#E8147F",
  border: "none",
  borderRadius: "6px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "9px 18px",
}

const btnDangerPrimary: React.CSSProperties = {
  backgroundColor: "#dc2626",
  border: "none",
  borderRadius: "6px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "9px 18px",
}

const btnGhost: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #333333",
  borderRadius: "6px",
  color: "#888888",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "9px 18px",
}
