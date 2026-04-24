"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type Intent =
  | { kind: "archive" }
  | { kind: "restore" }
  | { kind: "delete" }

interface Props {
  slug: string
  name: string
  status: "active" | "archived"
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export default function ProjectAdminActions({ slug, name, status, canMoveUp, canMoveDown }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(name)
  const [confirm, setConfirm] = useState<Intent | null>(null)

  async function handleMove(direction: -1 | 1) {
    setBusy(true)
    const res = await fetch("/portal/admin/projects/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, direction }),
    })
    setBusy(false)
    if (res.ok) router.refresh()
  }

  async function post(path: string, body: Record<string, string>) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  async function handleRename() {
    if (!renameValue.trim() || renameValue.trim() === name) {
      setRenaming(false)
      return
    }
    setBusy(true)
    const res = await post("/portal/admin/projects/rename", { slug, name: renameValue.trim() })
    setBusy(false)
    if (res.ok) {
      setRenaming(false)
      router.refresh()
    }
  }

  async function runConfirmed() {
    if (!confirm) return
    setBusy(true)
    if (confirm.kind === "archive") {
      await post("/portal/admin/projects/archive", { slug })
      setConfirm(null)
      setBusy(false)
      router.refresh()
    } else if (confirm.kind === "restore") {
      await post("/portal/admin/projects/restore", { slug })
      setConfirm(null)
      setBusy(false)
      router.refresh()
    } else if (confirm.kind === "delete") {
      const res = await post("/portal/admin/projects/delete", { slug })
      setBusy(false)
      setConfirm(null)
      if (res.ok) {
        router.push("/portal")
      }
    }
  }

  return (
    <div style={adminBarStyle}>
      <div style={adminBarLabelStyle}>Admin</div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {renaming ? (
          <>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename()
                if (e.key === "Escape") { setRenaming(false); setRenameValue(name) }
              }}
              style={renameInputStyle}
            />
            <button onClick={handleRename} disabled={busy} style={btnSave}>Save</button>
            <button onClick={() => { setRenaming(false); setRenameValue(name) }} style={btnGhost}>Cancel</button>
          </>
        ) : (
          <>
            {status === "active" && (canMoveUp !== undefined || canMoveDown !== undefined) && (
              <div style={{ display: "flex", gap: "2px" }}>
                <button
                  disabled={busy || !canMoveUp}
                  onClick={() => handleMove(-1)}
                  style={btnArrow(!canMoveUp)}
                  title="Move up in the project order"
                  aria-label={`Move ${name} up`}
                >
                  ↑
                </button>
                <button
                  disabled={busy || !canMoveDown}
                  onClick={() => handleMove(1)}
                  style={btnArrow(!canMoveDown)}
                  title="Move down in the project order"
                  aria-label={`Move ${name} down`}
                >
                  ↓
                </button>
              </div>
            )}
            <button disabled={busy} onClick={() => { setRenameValue(name); setRenaming(true) }} style={btnGhost}>
              Rename
            </button>
            {status === "active" ? (
              <button disabled={busy} onClick={() => setConfirm({ kind: "archive" })} style={btnGhost}>
                Archive
              </button>
            ) : (
              <button disabled={busy} onClick={() => setConfirm({ kind: "restore" })} style={btnRestore}>
                Restore
              </button>
            )}
            <button disabled={busy} onClick={() => setConfirm({ kind: "delete" })} style={btnDanger}>
              Delete
            </button>
          </>
        )}
      </div>

      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <h3 style={modalTitle}>
            {confirm.kind === "archive" && `Archive "${name}"?`}
            {confirm.kind === "restore" && `Restore "${name}"?`}
            {confirm.kind === "delete" && `Delete "${name}"?`}
          </h3>
          <p style={modalSubtitle}>
            {confirm.kind === "archive" && "Users with existing grants will lose access until you restore it. Files on the server are kept."}
            {confirm.kind === "restore" && "This brings the project back to active. Existing grants resume."}
            {confirm.kind === "delete" && "This removes the project and deletes its files from the server. This cannot be undone."}
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirm(null)} style={btnGhostLarge}>Cancel</button>
            <button
              disabled={busy}
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

const adminBarStyle: React.CSSProperties = {
  background: "#0f0f0f",
  border: "1px solid #1f1f1f",
  borderRadius: "8px",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
}

const adminBarLabelStyle: React.CSSProperties = {
  color: "#E8147F",
  fontSize: "0.65rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
}

const renameInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "200px",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "6px 10px",
  fontSize: "0.85rem",
  outline: "none",
}

function btnArrow(disabled: boolean): React.CSSProperties {
  return {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "4px",
    color: disabled ? "#333" : "#aaa",
    cursor: disabled ? "default" : "pointer",
    fontSize: "0.8rem",
    padding: "3px 8px",
    lineHeight: 1,
    opacity: disabled ? 0.4 : 1,
  }
}

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnRestore: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #1f3d1f",
  borderRadius: "4px",
  color: "#22c55e",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnDanger: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.75rem",
  padding: "4px 12px",
}

const btnSave: React.CSSProperties = {
  background: "#E8147F",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: 600,
  padding: "5px 14px",
}

const btnPrimary: React.CSSProperties = {
  background: "#E8147F",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "9px 18px",
}

const btnDangerPrimary: React.CSSProperties = {
  background: "#dc2626",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  padding: "9px 18px",
}

const btnGhostLarge: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#888",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "9px 18px",
}

const modalTitle: React.CSSProperties = {
  color: "#fff",
  fontSize: "1.1rem",
  fontWeight: 700,
  margin: "0 0 8px",
}

const modalSubtitle: React.CSSProperties = {
  color: "#888",
  fontSize: "0.85rem",
  margin: "0 0 24px",
  lineHeight: 1.5,
}
