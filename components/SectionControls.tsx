"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface AddSectionButtonProps {
  slug: string
}

export function AddSectionButton({ slug }: AddSectionButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setErr(null)
    const res = await fetch("/portal/admin/projects/section-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: trimmed }),
    })
    setBusy(false)
    if (res.ok) {
      setOpen(false)
      setName("")
      router.refresh()
    } else {
      const body = await res.json().catch(() => ({}))
      setErr(body?.error ?? "Failed to create section")
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnAddSection} type="button">
        + Add Section
      </button>
      {open && (
        <Modal onClose={() => { setOpen(false); setErr(null) }}>
          <h3 style={modalTitle}>New section</h3>
          <p style={modalSub}>Create a section to group files inside this project.</p>
          <form onSubmit={create}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BridgeBox"
              style={modalInput}
            />
            {err && <p style={errText}>{err}</p>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button type="button" onClick={() => { setOpen(false); setErr(null) }} style={btnGhost}>Cancel</button>
              <button type="submit" disabled={busy || !name.trim()} style={btnPrimary}>
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

interface SectionHeaderAdminProps {
  slug: string
  name: string
  index: number
  total: number
  pageCount: number
}

export function SectionHeaderAdmin({ slug, name, index, total, pageCount }: SectionHeaderAdminProps) {
  const router = useRouter()
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(name)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function post(path: string, body: Record<string, unknown>) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      setErr(b?.error ?? "Action failed")
    }
    return res
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed || trimmed === name) { setRenaming(false); return }
    setBusy(true)
    setErr(null)
    const res = await post("/portal/admin/projects/section-rename", { slug, oldName: name, newName: trimmed })
    setBusy(false)
    if (res.ok) { setRenaming(false); router.refresh() }
  }

  async function doDelete() {
    setBusy(true)
    const res = await post("/portal/admin/projects/section-delete", { slug, name })
    setBusy(false)
    setConfirm(false)
    if (res.ok) router.refresh()
  }

  async function move(direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= total) return
    // client doesn't know the full order here; fetch from a data-attr on parent? Simpler: compute locally via DOM querySelectorAll. Instead we POST nothing and rely on server to handle move: use a dedicated swap. Since reorder API takes full order, we can't easily just swap. So post a "move" signal via reorder with two items swapped by reading siblings. We'll do it via DOM read.
    const nodes = document.querySelectorAll<HTMLElement>("[data-section-name]")
    const order: string[] = []
    nodes.forEach((n) => {
      const v = n.getAttribute("data-section-name")
      if (v) order.push(v)
    })
    if (order[index] !== name) return
    const [moved] = order.splice(index, 1)
    if (!moved) return
    order.splice(target, 0, moved)
    setBusy(true)
    const res = await post("/portal/admin/projects/section-reorder", { slug, order })
    setBusy(false)
    if (res.ok) router.refresh()
  }

  return (
    <div style={sectionHeaderRow}>
      {renaming ? (
        <form onSubmit={rename} style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1, maxWidth: "420px" }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setRenaming(false); setNewName(name) } }}
            style={inlineInput}
          />
          <button type="submit" disabled={busy} style={btnSaveSmall}>Save</button>
          <button type="button" onClick={() => { setRenaming(false); setNewName(name) }} style={btnGhostSmall}>Cancel</button>
        </form>
      ) : (
        <h2 style={sectionTitle}>{name} <span style={sectionCount}>· {pageCount}</span></h2>
      )}

      {!renaming && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button onClick={() => move(-1)} disabled={busy || index === 0} style={btnArrow} title="Move up" aria-label="Move up">↑</button>
          <button onClick={() => move(1)} disabled={busy || index === total - 1} style={btnArrow} title="Move down" aria-label="Move down">↓</button>
          <button onClick={() => setRenaming(true)} style={btnGhostSmall} disabled={busy}>Rename</button>
          <button onClick={() => setConfirm(true)} style={btnDangerSmall} disabled={busy}>Delete</button>
        </div>
      )}

      {err && <span style={errText}>{err}</span>}

      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <h3 style={modalTitle}>Delete section &ldquo;{name}&rdquo;?</h3>
          <p style={modalSub}>
            The section is removed. Files in it stay in the project but become unsectioned. Cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setConfirm(false)} style={btnGhost}>Cancel</button>
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
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
      <div style={{
        background: "#111",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "28px",
        width: "100%",
        maxWidth: "440px",
        fontFamily: "var(--font-exo2)",
      }}>
        {children}
      </div>
    </div>
  )
}

const btnAddSection: React.CSSProperties = {
  background: "transparent",
  border: "1px dashed #E8147F",
  borderRadius: "6px",
  color: "#E8147F",
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: "8px 16px",
  fontFamily: "var(--font-exo2)",
  letterSpacing: "0.03em",
}

const sectionHeaderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  padding: "20px 0 12px",
  borderBottom: "1px solid #1f1f1f",
  marginBottom: "20px",
}

const sectionTitle: React.CSSProperties = {
  color: "#F5C418",
  fontFamily: "var(--font-exo2)",
  fontSize: "1.15rem",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "0.02em",
}

const sectionCount: React.CSSProperties = { color: "#555", fontWeight: 400, fontSize: "0.85rem" }

const inlineInput: React.CSSProperties = {
  flex: 1,
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#fff",
  padding: "6px 10px",
  fontSize: "0.9rem",
  outline: "none",
  fontFamily: "var(--font-exo2)",
}

const btnArrow: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#888",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "2px 8px",
  fontFamily: "var(--font-exo2)",
  minWidth: "28px",
}

const btnGhostSmall: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "0.7rem",
  padding: "3px 10px",
  fontFamily: "var(--font-exo2)",
}

const btnSaveSmall: React.CSSProperties = {
  background: "#E8147F",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "4px 12px",
  fontFamily: "var(--font-exo2)",
}

const btnDangerSmall: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.7rem",
  padding: "3px 10px",
  fontFamily: "var(--font-exo2)",
}

const modalTitle: React.CSSProperties = { color: "#fff", fontSize: "1rem", fontWeight: 700, margin: "0 0 10px" }
const modalSub: React.CSSProperties = { color: "#888", fontSize: "0.85rem", margin: "0 0 20px", lineHeight: 1.5 }
const modalInput: React.CSSProperties = {
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
const errText: React.CSSProperties = { color: "#ef4444", fontSize: "0.75rem", margin: "8px 0 0" }
