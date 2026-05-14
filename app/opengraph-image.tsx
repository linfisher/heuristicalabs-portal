import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Heuristica Labs — Venture Studio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #1a1a2e 0%, #0a0a0a 55%, #050505 100%)",
          color: "white",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background:
              "linear-gradient(90deg, #E8147F 0%, #F5C418 50%, #22c55e 100%)",
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 148,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#ffffff",
            display: "flex",
          }}
        >
          HEURISTICA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: "#cccccc",
            marginTop: 28,
            letterSpacing: "0.01em",
            display: "flex",
          }}
        >
          Venture Studio · Bold Ideas · Real Products
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 64,
            fontSize: 24,
            color: "#777777",
            letterSpacing: "0.06em",
            display: "flex",
          }}
        >
          heuristicalabs.com
        </div>
      </div>
    ),
    { ...size },
  )
}
