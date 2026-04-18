"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

const MAX_CHARS = 500

type Status = "idle" | "submitting" | "success" | "error"

type ProjectOption = { slug: string; name: string }

export default function RequestAccessForm({ projects }: { projects: ProjectOption[] }) {
  const searchParams = useSearchParams()
  const preselect = searchParams.get("project") ?? ""

  const [projectSlug, setProjectSlug] = useState(preselect)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (preselect) setProjectSlug(preselect)
  }, [preselect])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectSlug) return
    setStatus("submitting")
    setErrorMsg("")

    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug, message }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string })?.error ?? `Request failed (${res.status})`)
      }

      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  if (status === "success") {
    return (
      <Wrapper>
        <p style={{ color: "#FAF7F0", fontSize: "1rem", textAlign: "center", maxWidth: "28rem", margin: "0 auto", lineHeight: 1.5 }}>
          Request sent. You'll receive an email when access is granted.
        </p>
      </Wrapper>
    )
  }

  const canSend = !!projectSlug && status !== "submitting"

  return (
    <Wrapper>
      <div style={{ width: "100%", maxWidth: "32rem" }}>
        <h1 style={{ color: "#FAF7F0", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "0.02em", margin: "0 0 8px" }}>
          Request Access
        </h1>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 32px", lineHeight: 1.5 }}>
          Pick a project. Add a note if it helps. Access is granted manually.
        </p>

        <form onSubmit={handleSubmit} aria-busy={status === "submitting"} className="flex flex-col gap-8">
          <div>
            <FieldLabel>Project</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {projects.map((p) => (
                <Chip key={p.slug} selected={projectSlug === p.slug} onClick={() => setProjectSlug(p.slug)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>
              Message{" "}
              <span style={{ color: "#555", fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>
                (optional)
              </span>
            </FieldLabel>
            <textarea
              value={message}
              onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value) }}
              maxLength={MAX_CHARS}
              placeholder="Tell us why you need access..."
              rows={5}
              style={{
                width: "100%",
                background: "#111",
                border: "1px solid #2a2a2a",
                color: "#FAF7F0",
                borderRadius: "6px",
                padding: "10px 12px",
                fontSize: "14px",
                outline: "none",
                fontFamily: "var(--font-exo2)",
                resize: "vertical",
                minHeight: "120px",
              }}
            />
            <div style={{ color: "#444", fontSize: "0.7rem", textAlign: "right", marginTop: "4px" }}>
              {message.length} / {MAX_CHARS}
            </div>
          </div>

          {status === "error" && (
            <p role="alert" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!canSend}
            style={{
              background: canSend ? "#E8147F" : "#2a2a2a",
              color: canSend ? "#FAF7F0" : "#555",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "var(--font-exo2)",
              cursor: canSend ? "pointer" : "not-allowed",
              letterSpacing: "0.05em",
              transition: "opacity 0.15s",
            }}
          >
            {status === "submitting" ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>
    </Wrapper>
  )
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "calc(100vh - 4rem)",
        fontFamily: "var(--font-exo2)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", color: "#aaa", fontSize: "0.72rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
      {children}
    </label>
  )
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? "#E8147F" : "transparent",
        color: selected ? "#FAF7F0" : "#aaa",
        border: `1px solid ${selected ? "#E8147F" : "#333"}`,
        borderRadius: "999px",
        padding: "8px 14px",
        fontSize: "0.8rem",
        fontFamily: "var(--font-exo2)",
        cursor: "pointer",
        transition: "all 0.12s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  )
}
