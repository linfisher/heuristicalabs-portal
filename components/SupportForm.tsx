"use client"

import { useState } from "react"

const CATEGORIES = [
  "Access — I can't open a project",
  "Access — I need more time on a grant",
  "Access — I want a different project",
  "File or viewer won't load",
  "Bug report",
  "Other",
] as const

const URGENCIES = ["Low", "Normal", "Urgent"] as const
const CONTACT_PREFS = ["Email", "Call me"] as const

type ProjectOption = { slug: string; name: string }

type Status = "idle" | "submitting" | "success" | "error"

const MAX = 1500

export default function SupportForm({ projects }: { projects: ProjectOption[] }) {
  const [category, setCategory] = useState<string>(CATEGORIES[1])
  const [urgency, setUrgency] = useState<string>(URGENCIES[1])
  const [projectSlug, setProjectSlug] = useState<string>("")
  const [contactPreference, setContactPreference] = useState<string>(CONTACT_PREFS[0])
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          urgency,
          projectSlug,
          contactPreference,
          message,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
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
          Support request sent. You'll hear back at your email soon.
        </p>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div style={{ width: "100%", maxWidth: "32rem" }}>
        <h1 style={{ color: "#FAF7F0", fontSize: "1.75rem", fontWeight: 600, letterSpacing: "0.02em", margin: "0 0 8px" }}>
          Support
        </h1>
        <p style={{ color: "#666", fontSize: "0.9rem", margin: "0 0 32px", lineHeight: 1.5 }}>
          Pick what's going on. Most fields are buttons — use the text box only if you need to add detail.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          <ChipGroup label="What's going on?" options={CATEGORIES as unknown as string[]} value={category} onChange={setCategory} />
          <ChipGroup label="Urgency" options={URGENCIES as unknown as string[]} value={urgency} onChange={setUrgency} />

          {projects.length > 0 && (
            <div>
              <FieldLabel>Related project (optional)</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <Chip selected={projectSlug === ""} onClick={() => setProjectSlug("")}>
                  None / Not specific
                </Chip>
                {projects.map((p) => (
                  <Chip key={p.slug} selected={projectSlug === p.slug} onClick={() => setProjectSlug(p.slug)}>
                    {p.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <ChipGroup label="How should we reach you?" options={CONTACT_PREFS as unknown as string[]} value={contactPreference} onChange={setContactPreference} />

          <div>
            <FieldLabel>Anything else? (optional)</FieldLabel>
            <textarea
              value={message}
              onChange={(e) => { if (e.target.value.length <= MAX) setMessage(e.target.value) }}
              maxLength={MAX}
              rows={5}
              placeholder="Add any detail that would help..."
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
              {message.length} / {MAX}
            </div>
          </div>

          {status === "error" && (
            <p role="alert" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              background: status === "submitting" ? "#2a2a2a" : "#E8147F",
              color: status === "submitting" ? "#555" : "#FAF7F0",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "var(--font-exo2)",
              cursor: status === "submitting" ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {status === "submitting" ? "Sending..." : "Send"}
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

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((opt) => (
          <Chip key={opt} selected={value === opt} onClick={() => onChange(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
    </div>
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
