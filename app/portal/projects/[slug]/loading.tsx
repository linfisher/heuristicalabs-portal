export default function ProjectLoading() {
  return (
    <div style={{ background: "#0A0A0A", minHeight: "calc(100vh - 4rem)" }} className="px-6 py-10">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Breadcrumb skeleton */}
        <div style={{ height: 14, width: 140, background: "#111", borderRadius: 4, marginBottom: 32 }} className="animate-pulse" />

        {/* Title skeleton */}
        <div style={{ height: 32, width: 240, background: "#111", borderRadius: 6, marginBottom: 10 }} className="animate-pulse" />
        <div style={{ height: 14, width: 100, background: "#111", borderRadius: 4, marginBottom: 40 }} className="animate-pulse" />

        {/* Thumbnail grid skeleton */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#111",
                border: "1px solid #1f1f1f",
                borderRadius: "8px",
                overflow: "hidden",
              }}
              className="animate-pulse"
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "8.5 / 11",
                  background: "#141414",
                }}
              />
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ height: 10, width: "80%", background: "#1a1a1a", borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
