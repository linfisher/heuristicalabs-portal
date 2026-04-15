import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

export const subject = (projectName: string) =>
  `You now have access to ${projectName}`;

interface GrantConfirmationEmailProps {
  userName: string;
  projectName: string;
  expiresAt: number;
  projectUrl: string;
}

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " UTC"
}

export default function GrantConfirmationEmail({
  userName,
  projectName,
  expiresAt,
  projectUrl,
}: GrantConfirmationEmailProps) {
  const formattedExpiry = formatExpiry(expiresAt);

  return (
    <Html>
      <Head />
      <Preview>You now have access to {projectName}</Preview>
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
            You&apos;ve been granted access to <strong>{projectName}</strong>.
            Your access is valid until {formattedExpiry}.
          </Text>

          <Button href={projectUrl} style={cta}>
            Open {projectName}
          </Button>

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
  margin: "0 0 24px",
  lineHeight: "1.5",
};

const cta: React.CSSProperties = {
  backgroundColor: "#0A0A0A",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  borderRadius: "4px",
  display: "inline-block",
  textDecoration: "none",
  marginBottom: "32px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
  lineHeight: "1.5",
};
