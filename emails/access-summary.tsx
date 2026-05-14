import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

export const subject = "Your Heuristica Labs portal access";

interface AccessSummaryEmailProps {
  userName: string;
  projects: { name: string; expiresAt: number; url: string }[];
  portalUrl: string;
}

function formatExpiry(expiresAt: number): string {
  return (
    new Date(expiresAt).toLocaleString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " UTC"
  );
}

export default function AccessSummaryEmail({
  userName,
  projects,
  portalUrl,
}: AccessSummaryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your current Heuristica Labs portal access</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://www.heuristicalabs.com/logo.png"
            width="120"
            alt="Heuristica Labs"
            style={logo}
          />

          <Text style={heading}>Hi {userName},</Text>

          <Text style={text}>
            Here&apos;s a snapshot of your current portal access:
          </Text>

          {projects.length === 0 ? (
            <Text style={text}>
              You don&apos;t currently have access to any projects.
            </Text>
          ) : (
            <div style={list}>
              {projects.map((p) => (
                <div key={p.url} style={listItem}>
                  <Link href={p.url} style={projectLink}>
                    {p.name}
                  </Link>
                  <Text style={expiryText}>
                    Valid until {formatExpiry(p.expiresAt)}
                  </Text>
                </div>
              ))}
            </div>
          )}

          <Hr style={hr} />

          <Text style={text}>
            Open the portal:{" "}
            <Link href={portalUrl} style={inlineLink}>
              {portalUrl}
            </Link>
          </Text>

          <Text style={footer}>
            If you have questions, reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "560px",
};

const logo: React.CSSProperties = {
  display: "block",
  marginBottom: "32px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#000000",
  margin: "0 0 16px",
};

const text: React.CSSProperties = {
  fontSize: "15px",
  color: "#000000",
  margin: "0 0 16px",
  lineHeight: "1.5",
};

const list: React.CSSProperties = {
  margin: "16px 0 24px",
};

const listItem: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #eeeeee",
};

const projectLink: React.CSSProperties = {
  color: "#0A0A0A",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "underline",
};

const expiryText: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: "4px 0 0",
};

const inlineLink: React.CSSProperties = {
  color: "#0A0A0A",
  textDecoration: "underline",
};

const hr: React.CSSProperties = {
  borderColor: "#eeeeee",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
  lineHeight: "1.5",
};
