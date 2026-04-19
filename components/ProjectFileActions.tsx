"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

const MAX_SIZE = 50 * 1024 * 1024

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; progress: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

type DuplicateIntent = {
  file: File
  existingTitle: string
  existingPath: string
  index: number
  total: number
}

export default function ProjectFileActions({ slug }: { slug: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [dragOver, setDragOver] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [duplicate, setDuplicate] = useState<DuplicateIntent | null>(null)
  const resumeRef = useRef<((overwrite: boolean | "cancel") => void) | null>(null)

  function sendUpload(file: File, overwrite: boolean, index: number, total: number): Promise<{ ok: boolean; status: number; error?: string; existingTitle?: string; existingPath?: string }> {
    return new Promise((resolve) => {
      const prefix = total > 1 ? `(${index + 1}/${total}) ` : ""
      setStatus({ kind: "uploading", name: `${prefix}${file.name}`, progress: 0 })

      const form = new FormData()
      form.set("slug", slug)
      form.set("file", file)
      if (overwrite) form.set("overwrite", "1")

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/portal/admin/projects/upload")
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setStatus({ kind: "uploading", name: `${prefix}${file.name}`, progress })
        }
      }
      xhr.onload = () => {
        let parsed: Record<string, unknown> = {}
        try { parsed = JSON.parse(xhr.responseText) as Record<string, unknown> } catch {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true, status: xhr.status })
        } else {
          resolve({
            ok: false,
            status: xhr.status,
            error: typeof parsed.error === "string" ? parsed.error : `HTTP ${xhr.status}`,
            existingTitle: typeof parsed.existingTitle === "string" ? parsed.existingTitle : undefined,
            existingPath: typeof parsed.existingPath === "string" ? parsed.existingPath : undefined,
          })
        }
      }
      xhr.onerror = () => resolve({ ok: false, status: 0, error: "network error" })
      xhr.send(form)
    })
  }

  async function uploadOne(file: File, index: number, total: number): Promise<{ ok: boolean; error?: string }> {
    if (file.size > MAX_SIZE) {
      return { ok: false, error: `"${file.name}" is larger than 50 MB` }
    }

    // First attempt, no overwrite
    let result = await sendUpload(file, false, index, total)

    // Duplicate? Ask the admin via the shared confirm modal.
    if (!result.ok && result.status === 409 && result.existingTitle) {
      const decision = await new Promise<boolean | "cancel">((resolve) => {
        resumeRef.current = resolve
        setDuplicate({
          file,
          existingTitle: result.existingTitle ?? file.name,
          existingPath: result.existingPath ?? "",
          index,
          total,
        })
      })
      setDuplicate(null)
      resumeRef.current = null

      if (decision === "cancel") return { ok: false, error: `"${file.name}": skipped (duplicate)` }
      if (decision === true) {
        result = await sendUpload(file, true, index, total)
      }
    }

    if (result.ok) return { ok: true }
    return { ok: false, error: `"${file.name}": ${result.error ?? "upload failed"}` }
  }

  async function uploadMany(files: FileList | File[]) {
    const arr = Array.from(files)
    let success = 0
    const failures: string[] = []

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      if (!file) continue
      const r = await uploadOne(file, i, arr.length)
      if (r.ok) success++
      else if (r.error) failures.push(r.error)
    }

    if (success > 0) router.refresh()

    if (failures.length === 0) {
      setStatus({ kind: "success", message: arr.length > 1 ? `Uploaded ${success} files` : `Uploaded ${arr[0]?.name ?? "file"}` })
    } else if (success > 0) {
      setStatus({ kind: "error", message: `${success} uploaded, ${failures.length} skipped — ${failures[0]}` })
    } else {
      setStatus({ kind: "error", message: failures[0] ?? "Upload failed" })
    }

    setTimeout(() => setStatus({ kind: "idle" }), 3500)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      uploadMany(e.dataTransfer.files)
    }
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          background: dragOver ? "#1a1015" : "#0f0f0f",
          border: `1px dashed ${dragOver ? "#E8147F" : "#333"}`,
          borderRadius: "10px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px" }}>
            Drop files to upload
          </div>
          <div style={{ color: "#666", fontSize: "0.78rem" }}>
            Any file up to 50 MB. PDFs and Markdown get an in-portal preview; images, video, and audio play inline; other files get a download link. Or paste a YouTube / Drive / Dropbox / Vimeo URL.
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#E8147F",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "9px 18px",
              fontFamily: "var(--font-exo2)",
            }}
          >
            Choose Files
          </button>
          <button
            type="button"
            onClick={() => setLinkModalOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid #333",
              borderRadius: "6px",
              color: "#aaa",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 600,
              padding: "9px 18px",
              fontFamily: "var(--font-exo2)",
            }}
          >
            + Add Link
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.length) uploadMany(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {status.kind === "uploading" && (
        <StatusLine color="#E8147F">
          Uploading {status.name}… {status.progress}%
        </StatusLine>
      )}
      {status.kind === "success" && <StatusLine color="#22c55e">{status.message}</StatusLine>}
      {status.kind === "error" && <StatusLine color="#ef4444">{status.message}</StatusLine>}

      {duplicate && (
        <DuplicateModal
          fileName={duplicate.file.name}
          existingTitle={duplicate.existingTitle}
          onDecision={(d) => resumeRef.current?.(d)}
        />
      )}

      {linkModalOpen && (
        <AddLinkModal
          slug={slug}
          onClose={() => setLinkModalOpen(false)}
          onAdded={() => { setLinkModalOpen(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function StatusLine({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ color, fontSize: "0.8rem", marginTop: "10px", fontFamily: "var(--font-exo2)" }}>
      {children}
    </div>
  )
}

function DuplicateModal({
  fileName,
  existingTitle,
  onDecision,
}: {
  fileName: string
  existingTitle: string
  onDecision: (d: boolean | "cancel") => void
}) {
  return (
    <Modal onClose={() => onDecision("cancel")}>
      <h3 style={modalTitle}>File already exists</h3>
      <p style={modalSub}>
        A file named <strong style={{ color: "#fff" }}>&ldquo;{existingTitle}&rdquo;</strong> is already in this project.
        Overwrite it with the new <strong style={{ color: "#fff" }}>{fileName}</strong>?
      </p>
      <p style={{ ...modalSub, fontSize: "0.78rem" }}>
        The old file will be replaced on the server. This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button onClick={() => onDecision("cancel")} style={btnGhost}>Skip</button>
        <button onClick={() => onDecision(true)} style={btnDangerPrimary}>Overwrite</button>
      </div>
    </Modal>
  )
}

function AddLinkModal({
  slug,
  onClose,
  onAdded,
}: {
  slug: string
  onClose: () => void
  onAdded: () => void
}) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    if (!url.trim() || !title.trim()) return
    setBusy(true)
    setError("")
    const res = await fetch("/portal/admin/projects/add-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, url, title }),
    })
    setBusy(false)
    if (res.ok) {
      onAdded()
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      setError(data.error ?? "Failed to add link")
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={modalTitle}>Add Link</h3>
      <p style={modalSub}>
        Paste a YouTube, Google Drive, Dropbox, or Vimeo URL to embed it. Other links open externally.
      </p>

      <label style={label}>Title</label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Warehouse walkthrough video"
        style={modalInputStyle}
      />

      <label style={{ ...label, marginTop: "16px" }}>URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit() }}
        placeholder="https://..."
        style={modalInputStyle}
      />

      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "12px 0 0" }}>{error}</p>}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
        <button onClick={onClose} style={btnGhost}>Cancel</button>
        <button disabled={busy || !url.trim() || !title.trim()} onClick={submit} style={{ ...btnPrimary, opacity: busy || !url.trim() || !title.trim() ? 0.5 : 1 }}>
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </Modal>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "460px",
          fontFamily: "var(--font-exo2)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

const modalTitle: React.CSSProperties = { color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }
const modalSub: React.CSSProperties = { color: "#888", fontSize: "0.85rem", margin: "0 0 16px", lineHeight: 1.5 }
const label: React.CSSProperties = { display: "block", color: "#aaa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }
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
