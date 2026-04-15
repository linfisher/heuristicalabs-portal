"use client"

export default function PortalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ background: "#0A0A0A", color: "#FAF7F0", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 4rem)" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        <h1 style={{ color: "#E8147F", fontSize: "1.75rem", marginBottom: "1rem" }}>Something went wrong</h1>
        <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>An error occurred loading this page. Please try again.</p>
        <button
          onClick={reset}
          style={{ background: "#E8147F", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
