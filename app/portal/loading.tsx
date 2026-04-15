export default function PortalLoading() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "calc(100vh - 4rem)", padding: "48px 24px" }}>
      <div style={{ maxWidth: 896, margin: "0 auto" }}>
        <div style={{ height: 32, width: 180, background: "#111", borderRadius: 6, marginBottom: 40 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 80, background: "#111", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
