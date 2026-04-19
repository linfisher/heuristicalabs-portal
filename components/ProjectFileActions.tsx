"use client"

import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

const ACCEPT = ".pdf,.md,.markdown"
const MAX_SIZE = 50 * 1024 * 1024

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; progress: number }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

export default function ProjectFileActions({ slug }: { slug: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const [dragOver, setDragOver] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)

  async function uploadOne(file: File) {
    if (file.size > MAX_SIZE) {
      setStatus({ kind: "error", message: `"${file.name}" is larger than 50 MB` })
      return
    }
    const name = file.name.toLowerCase()
    if (!(name.endsWith(".pdf") || name.endsWith(".md") || name.endsWith(".markdown"))) {
      setStatus({ kind: "error", message: `"${file.name}" is not a PDF or Markdown file` })
      return
    }

    setStatus({ kind: "uploading", name: file.name, progress: 0 })

    const form = new FormData()
    form.set("slug", slug)
    form.set("file", file)

    // XHR for progress reporting (fetch doesn't expose upload progress)
    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/portal/admin/projects/upload")
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setStatus({ kind: "uploading", name: file.name, progress })
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus({ kind: "success", message: `Uploaded ${file.name}` })
        } else {
          let msg = `Upload failed (${xhr.status})`
          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: string }
            if (parsed.error) msg = parsed.error
          } catch {}
          setStatus({ kind: "error", message: msg })
        }
        resolve()
      }
      xhr.onerror = () => {
        setStatus({ kind: "error", message: "Upload failed (network)" })
        resolve()
      }
      xhr.send(form)
    })

    router.refresh()
  }

  async function uploadMany(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      await uploadOne(file)
    }
    // Clear status after a moment
    setTimeout(() => setStatus({ kind: "idle" }), 2500)
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
            PDF or Markdown, max 50 MB each. Or paste a link to YouTube / Drive / Dropbox.
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
          accept={ACCEPT}
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
        <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px" }}>Add Link</h3>
        <p style={{ color: "#888", fontSize: "0.85rem", margin: "0 0 20px", lineHeight: 1.5 }}>
          Paste a YouTube, Google Drive, Dropbox, or Vimeo URL to embed it. Other links open externally.
        </p>

        <label style={{ display: "block", color: "#aaa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          Title
        </label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Warehouse walkthrough video"
          style={modalInputStyle}
        />

        <label style={{ display: "block", color: "#aaa", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: "16px 0 6px" }}>
          URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit() }}
          placeholder="https://..."
          style={modalInputStyle}
        />

        {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "12px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            onClick={onClose}
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
            disabled={busy || !url.trim() || !title.trim()}
            onClick={submit}
            style={{
              background: busy || !url.trim() || !title.trim() ? "#7a0a43" : "#E8147F",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              cursor: busy || !url.trim() || !title.trim() ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              padding: "9px 18px",
              fontFamily: "inherit",
            }}
          >
            {busy ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  fontFamily: "inherit",
}
