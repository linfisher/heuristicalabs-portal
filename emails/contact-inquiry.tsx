import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

export const subject = (projectName: string, mode: "nda" | "contact") =>
  mode === "nda"
    ? `NDA Request — ${projectName}`
    : `Contact — ${projectName}`

interface ContactInquiryEmailProps {
  mode: "nda" | "contact"
  project: string
  name: string
  email: string
  company?: string
  message: string
  submittedAt: string
}

export default function ContactInquiryEmail({
  mode,
  project,
  name,
  email,
  company,
  message,
  submittedAt,
}: ContactInquiryEmailProps) {
  const isNda = mode === "nda"
  const label = isNda ? "NDA Request" : "Inquiry"

  return (
    <Html>
      <Head />
      <Preview>
        {label} from {name}
        {company ? ` (${company})` : ""} about {project}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={badge}>{label.toUpperCase()}</Text>
          <Heading style={heading}>{project}</Heading>

          <Section style={metaCard}>
            <Row label="From"    value={name} />
            <Row label="Email"   value={email} />
            {company ? <Row label="Company" value={company} /> : null}
            <Row label="Mode"    value={isNda ? "NDA Request" : "General inquiry"} />
            <Row label="When"    value={submittedAt} />
          </Section>

          <Text style={msgLabel}>Message</Text>
          <Text style={msgBody}>{message}</Text>

          <Text style={footer}>
            Reply directly to this email — it will go to {email}.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={row}>
      <span style={rowLabel}>{label}</span>
      <span style={rowValue}>{value}</span>
    </Text>
  )
}

const body: React.CSSProperties = {
  backgroundColor: "#f7f7f7",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: "24px 0",
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 32px",
  maxWidth: "600px",
  borderRadius: "8px",
}

const badge: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.5px",
  color: "#E8147F",
  margin: "0 0 8px",
}

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#0A0A0A",
  margin: "0 0 24px",
  letterSpacing: "-0.01em",
}

const metaCard: React.CSSProperties = {
  backgroundColor: "#fafafa",
  border: "1px solid #eeeeee",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 24px",
}

const row: React.CSSProperties = {
  fontSize: "14px",
  color: "#0A0A0A",
  margin: "0 0 6px",
  lineHeight: 1.5,
  display: "block",
}

const rowLabel: React.CSSProperties = {
  display: "inline-block",
  width: "80px",
  color: "#888888",
  fontWeight: 600,
}

const rowValue: React.CSSProperties = {
  color: "#0A0A0A",
}

const msgLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.2px",
  color: "#888888",
  textTransform: "uppercase",
  margin: "0 0 8px",
}

const msgBody: React.CSSProperties = {
  fontSize: "15px",
  color: "#0A0A0A",
  lineHeight: 1.6,
  margin: "0 0 32px",
  whiteSpace: "pre-wrap",
}

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#888888",
  margin: "0",
  paddingTop: "16px",
  borderTop: "1px solid #eeeeee",
}
