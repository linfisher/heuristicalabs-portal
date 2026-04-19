"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

interface Ctx {
  selected: Set<string>
  toggle: (pagePath: string) => void
  clear: () => void
  isSelected: (pagePath: string) => boolean
  count: number
}

const SelectionContext = createContext<Ctx | null>(null)

export function BulkSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = useCallback((pagePath: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(pagePath)) next.delete(pagePath)
      else next.add(pagePath)
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const isSelected = useCallback((p: string) => selected.has(p), [selected])

  const value = useMemo<Ctx>(
    () => ({ selected, toggle, clear, isSelected, count: selected.size }),
    [selected, toggle, clear, isSelected]
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useBulkSelection(): Ctx {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error("useBulkSelection must be used inside BulkSelectionProvider")
  return ctx
}

// ── Checkbox rendered inside each card ────────────────────────────────

export function BulkSelectCheckbox({ pagePath }: { pagePath: string }) {
  const { isSelected, toggle } = useBulkSelection()
  const checked = isSelected(pagePath)
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "4px",
        background: checked ? "#E8147F" : "rgba(0,0,0,0.75)",
        border: `1px solid ${checked ? "#E8147F" : "#555"}`,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { e.stopPropagation(); toggle(pagePath) }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </label>
  )
}

// ── Floating action bar (admin only) ──────────────────────────────────

export function BulkActionBar({ slug, sections }: { slug: string; sections: string[] }) {
  const router = useRouter()
  const { selected, clear, count } = useBulkSelection()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (count === 0) return null

  async function bulk(action: "delete" | "move", section?: string | null) {
    setBusy(true)
    setErr(null)
    const body: Record<string, unknown> = {
      slug,
      action,
      paths: Array.from(selected),
    }
    if (action === "move") body.section = section
    const res = await fetch("/portal/admin/projects/bulk-page-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setBusy(false)
    if (res.ok) {
      clear()
      setConfirm(false)
      router.refresh()
    } else {
      const b = await res.json().catch(() => ({}))
      setErr(b?.error ?? "Bulk action failed")
    }
  }

  return (
    <>
      <div style={barStyle}>
        <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>
          {count} selected
        </span>

        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => {
            const val = e.target.value
            if (val === "") return
            const section = val === "__none__" ? null : val
            bulk("move", section)
            e.currentTarget.value = ""
          }}
          style={selectStyle}
          title="Move selected to section"
        >
          <option value="">Move to…</option>
          <option value="__none__">— no section —</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button onClick={() => setConfirm(true)} disabled={busy} style={btnDanger}>
          Delete
        </button>
        <button onClick={clear} disabled={busy} style={btnGhost}>
          Clear
        </button>

        {err && <span style={errStyle}>{err}</span>}
      </div>

      {confirm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setConfirm(false) }}
          style={modalBackdropStyle}
        >
          <div style={modalCardStyle}>
            <h3 style={modalTitleStyle}>Delete {count} file{count !== 1 ? "s" : ""}?</h3>
            <p style={modalSubStyle}>
              The files will be removed from the project. PDFs and Markdown files will be deleted from disk. Cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirm(false)} style={btnGhostLarge}>Cancel</button>
              <button onClick={() => bulk("delete")} disabled={busy} style={btnDangerPrimary}>
                {busy ? "Deleting…" : `Delete ${count}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const barStyle: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "24px",
  transform: "translateX(-50%)",
  background: "#0a0a0a",
  border: "1px solid #E8147F",
  boxShadow: "0 8px 24px rgba(232,20,127,0.25)",
  borderRadius: "999px",
  padding: "10px 18px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontFamily: "var(--font-exo2)",
  zIndex: 50,
  flexWrap: "wrap",
  maxWidth: "calc(100vw - 32px)",
}

const selectStyle: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "4px",
  color: "#eee",
  fontSize: "0.8rem",
  padding: "5px 8px",
  fontFamily: "var(--font-exo2)",
  cursor: "pointer",
}

const btnDanger: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #3d1515",
  borderRadius: "4px",
  color: "#ef4444",
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: "5px 14px",
  fontFamily: "var(--font-exo2)",
}

const btnGhost: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "4px",
  color: "#aaa",
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: "5px 14px",
  fontFamily: "var(--font-exo2)",
}

const errStyle: React.CSSProperties = {
  color: "#ef4444",
  fontSize: "0.75rem",
}

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
}

const modalCardStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  padding: "28px",
  width: "100%",
  maxWidth: "440px",
  fontFamily: "var(--font-exo2)",
}

const modalTitleStyle: React.CSSProperties = { color: "#fff", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 10px" }
const modalSubStyle: React.CSSProperties = { color: "#888", fontSize: "0.85rem", margin: "0 0 20px", lineHeight: 1.5 }

const btnGhostLarge: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#888",
  cursor: "pointer",
  fontSize: "0.85rem",
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
