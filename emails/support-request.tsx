import type { ReactElement } from "react"

interface Props {
  fromEmail: string
  fromName: string
  category: string
  urgency: string
  projectSlug: string
  contactPreference: string
  message: string
  pageUrl: string
}

export default function SupportRequestEmail({
  fromEmail,
  fromName,
  category,
  urgency,
  projectSlug,
  contactPreference,
  message,
  pageUrl,
}: Props): ReactElement {
  const labelStyle: React.CSSProperties = {
    color: "#888888",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "4px",
    fontWeight: 600,
  }
  const valueStyle: React.CSSProperties = {
    color: "#FAF7F0",
    fontSize: "14px",
    marginBottom: "20px",
    lineHeight: 1.5,
  }

  return (
    <html>
      <body style={{ backgroundColor: "#0A0A0A", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            backgroundColor: "#111111",
            border: "1px solid #222",
            borderRadius: "8px",
            padding: "32px",
          }}
        >
          <h1 style={{ color: "#E8147F", fontSize: "18px", margin: "0 0 24px", fontWeight: 700 }}>
            Portal Support Request
          </h1>

          <div style={labelStyle}>From</div>
          <div style={valueStyle}>
            {fromName} &lt;{fromEmail}&gt;
          </div>

          <div style={labelStyle}>Category</div>
          <div style={valueStyle}>{category}</div>

          <div style={labelStyle}>Urgency</div>
          <div style={valueStyle}>{urgency}</div>

          {projectSlug ? (
            <>
              <div style={labelStyle}>Project</div>
              <div style={valueStyle}>{projectSlug}</div>
            </>
          ) : null}

          <div style={labelStyle}>Contact preference</div>
          <div style={valueStyle}>{contactPreference}</div>

          {message ? (
            <>
              <div style={labelStyle}>Details</div>
              <div style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>{message}</div>
            </>
          ) : null}

          <div style={labelStyle}>Page</div>
          <div style={{ ...valueStyle, color: "#666", fontSize: "12px", wordBreak: "break-all" }}>{pageUrl}</div>
        </div>
      </body>
    </html>
  )
}
