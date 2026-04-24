"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface Props {
  slug: string
  pagePath: string
  title: string
  sections?: string[]
  currentSection?: string
  canMoveLeft?: boolean
  canMoveRight?: boolean
}

export default function FileAdminActions({ slug, pagePath, title, sections = [], currentSection, canMoveLeft = false, canMoveRight = false }: Props) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(title)
  const [busy, setBusy] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)

  async function assignSection(section: string | null, e?: React.SyntheticEvent) {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setBusy(true)
    await post("/portal/admin/projects/page-assign-section", { slug, pagePath, section })
    setBusy(false)
    router.refresh()
  }

  async function move(direction: -1 | 1, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setBusy(true)
    await post("/portal/admin/projects/page-reorder", { slug, pagePath, direction })
    setBusy(false)
    router.refresh()
  }

  async function post(path: string, body: Record<string, unknown>) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  async function doDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setBusy(true)
    await post("/portal/admin/projects/page-delete", { slug, pagePath })
    setBusy(false)
    setConfirmDelete(false)
    router.refresh()
  }

  async function doRename(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || newTitle === title) {
      setRenaming(false)
      return
    }
    setBusy(true)
    setRenameError(null)
    try {
      const res = await post("/portal/admin/projects/page-rename", { slug, pagePath, title: newTitle.trim() })
      if (!res.ok) {
        let msg = `Server returned ${res.status}`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) msg = data.error
        } catch {}
        setRenameError(msg)
        setBusy(false)
        return
      }
      setBusy(false)
      setRenaming(false)
      router.refresh()
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Network error")
      setBusy(false)
    }
  }

  function stopProp(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      onClick={stopProp}
      style={{
        display: "flex",
        gap: "6px",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        fontFamily: "var(--font-exo2)",
      }}
    >
      <button
        type="button"
        onClick={(e) => move(-1, e)}
        disabled={busy || !canMoveLeft}
        style={btnArrow}
        title="Move left"
        aria-label="Move left"
      >
        ←
      </button>
      <button
        type="button"
        onClick={(e) => move(1, e)}
        disabled={busy || !canMoveRight}
        style={btnArrow}
        title="Move right"
        aria-label="Move right"
      >
        →
      </button>
      <button
        type="button"
        onClick={(e) => { stopProp(e); setNewTitle(title); setRenaming(true) }}
        style={btnSubtle}
        title="Rename"
        aria-label="Rename"
      >
        Rename
      </button>
      <button
        type="button"
        onClick={(e) => { stopProp(e); setConfirmDelete(true) }}
        style={btnDanger}
        title="Delete"
        aria-label="Delete"
      >
        Delete
      </button>

      {sections.length > 0 && (
        <select
          value={currentSection ?? ""}
          onChange={(e) => {
            const val = e.target.value
            assignSection(val === "" ? null : val)
          }}
          onClick={stopProp}
          disabled={busy}
          title="Move to section"
          aria-label="Move to section"
          style={selectStyle}
        >
          <option value="">— no section —</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {renaming && (
        <Modal onClose={() => { setRenaming(false); setRenameError(null) }}>
          <h3 style={modalTitle}>Rename file</h3>
          <form onSubmit={doRename} onClick={stopProp}>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => { setNewTitle(e.target.value); setRenameError(null) }}
              style={modalInputStyle}
            />
            {renameError && (
              <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "10px 0 0" }}>
                {renameError}
              </p>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" onClick={() => { setRenaming(false); setRenameError(null) }} style={btnGhost}>Cancel</button>
              <button type="submit" disabled={busy || !newTitle.trim()} style={btnPrimary}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(false)}>
          <h3 style={modalTitle}>Delete &quot;{title}&quot;?</h3>
          <p style={modalSub}>
            The file will be removed from the project and, if it&apos;s a PDF or Markdown, the underlying file will be deleted from the server. Cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirmDelete(false)} style={btnGhost}>Cancel</button>
            <button onClick={doDelete} disabled={busy} style={btnDangerPrimary}>
              {busy ? "Deleting…" : "Delete"}
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
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "28px",
          width: "100%",
          maxWidth: "420px",
          fontFamily: "var(--font-exo2)",
        }}
      >
        {children}
      </div>
    </div>
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

const btnArrow: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: "1px 7px",
  fontFamily: "var(--font-exo2)",
  minWidth: "22px",
  lineHeight: 1,
}

const btnDanger: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.65rem",
  padding: "3px 8px",
  fontFamily: "var(--font-exo2)",
  letterSpacing: "0.04em",
}

const modalTitle: React.CSSProperties = { color: "#fff", fontSize: "1rem", fontWeight: 700, margin: "0 0 10px" }
const modalSub: React.CSSProperties = { color: "#888", fontSize: "0.85rem", margin: "0 0 20px", lineHeight: 1.5 }
const modalInputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "0.9rem",
  padding: "10px 12px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "var(--font-exo2)",
}
const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#888",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "9px 18px",
  fontFamily: "var(--font-exo2)",
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
  fontFamily: "var(--font-exo2)",
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
  fontFamily: "var(--font-exo2)",
}
const selectStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#aaa",
  fontSize: "0.65rem",
  padding: "3px 6px",
  fontFamily: "var(--font-exo2)",
  cursor: "pointer",
  maxWidth: "100px",
  minWidth: 0,
  flexShrink: 1,
}
