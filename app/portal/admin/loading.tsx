export default function AdminLoading() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "calc(100vh - 4rem)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <div style={{ height: 32, width: 200, background: "#111", borderRadius: 6, marginBottom: 32 }} />
        <div style={{ border: "1px solid #1f2937", borderRadius: 8, overflow: "hidden" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, padding: "16px 20px", borderBottom: "1px solid #111" }}>
              {[0, 1, 2, 3].map((j) => (
                <div key={j} style={{ height: 16, background: "#111", borderRadius: 4 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
