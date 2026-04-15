import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{ background: "#0A0A0A", color: "#FAF7F0", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        <h1 style={{ color: "#E8147F", fontSize: "4rem", margin: 0, fontWeight: 700 }}>404</h1>
        <p style={{ color: "#9ca3af", margin: "1rem 0 2rem", fontSize: "1.1rem" }}>Page not found.</p>
        <Link href="/portal" style={{ color: "#E8147F", textDecoration: "none", fontWeight: 600 }}>
          Go to Portal
        </Link>
      </div>
    </div>
  )
}
