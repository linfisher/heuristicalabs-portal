"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#0A0A0A", color: "#FAF7F0", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <h1 style={{ color: "#E8147F", fontSize: "2rem", marginBottom: "1rem" }}>Something went wrong</h1>
          <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{ background: "#E8147F", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "1rem" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
