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
        throw new Error(data?.error ?? `Request failed (${res.status})`)
      }

      setStatus("success")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#111",
    border: "1px solid #2a2a2a",
    color: "#FAF7F0",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "var(--font-exo2)",
  }

  if (status === "success") {
    return (
      <div
        style={{
          background: "#0A0A0A",
          minHeight: "calc(100vh - 4rem)",
          fontFamily: "var(--font-exo2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <p style={{ color: "#FAF7F0" }} className="text-center text-base max-w-sm">
          Request sent. You will receive an email when access is granted.
        </p>
      </div>
    )
  }

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
      <div style={{ width: "100%", maxWidth: "32rem" }}>
        <h1 style={{ color: "#FAF7F0" }} className="text-2xl font-semibold tracking-wide mb-2">
          Request Access
        </h1>
        <p style={{ color: "#666" }} className="text-sm mb-8">
          Select a project and optionally include a note. Access is granted manually.
        </p>

        <form onSubmit={handleSubmit} aria-busy={status === "submitting"} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label style={{ color: "#aaa" }} className="text-xs font-medium uppercase tracking-widest">
              Project
            </label>
            <select
              value={projectSlug}
              onChange={(e) => setProjectSlug(e.target.value)}
              required
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
              className="focus:ring-2 focus:ring-[#E8147F] focus:border-[#E8147F] transition-colors"
            >
              <option value="" disabled style={{ color: "#666" }}>
                Select a project...
              </option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug} style={{ background: "#111", color: "#FAF7F0" }}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={{ color: "#aaa" }} className="text-xs font-medium uppercase tracking-widest">
              Message{" "}
              <span style={{ color: "#555" }} className="normal-case tracking-normal font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value)
              }}
              maxLength={MAX_CHARS}
              placeholder="Tell us why you need access..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
              className="focus:ring-2 focus:ring-[#E8147F] focus:border-[#E8147F] transition-colors"
            />
            <span style={{ color: "#444" }} className="text-xs text-right">
              {message.length} / {MAX_CHARS}
            </span>
          </div>

          {status === "error" && (
            <p role="alert" style={{ color: "#E8147F" }} className="text-sm">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || !projectSlug}
            style={{
              background: status === "submitting" || !projectSlug ? "#2a2a2a" : "#E8147F",
              color: status === "submitting" || !projectSlug ? "#555" : "#FAF7F0",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "var(--font-exo2)",
              cursor: status === "submitting" || !projectSlug ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-90"
          >
            {status === "submitting" ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  )
}
