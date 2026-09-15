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
import { isNeverExpiring } from "@/lib/durations";

export const subject = "You're invited to the Heuristica Labs portal";

interface UserInviteEmailProps {
  inviteUrl: string;
  projects: { name: string; expiresAt: number }[];
}

function formatExpiry(expiresAt: number): string {
  return new Date(expiresAt).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserInviteEmail({
  inviteUrl,
  projects,
}: UserInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to the Heuristica Labs portal</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://www.heuristicalabs.com/logo.png"
            width="120"
            alt="Heuristica Labs"
            style={logo}
          />

          <Text style={heading}>You&apos;re invited</Text>

          <Text style={text}>
            You&apos;ve been given access to the Heuristica Labs private portal.
            Accept the invite to create your sign-in, and these projects will be
            waiting for you:
          </Text>

          {projects.map((p) => (
            <Text key={p.name} style={projectLine}>
              <strong>{p.name}</strong>
              {" — "}
              {isNeverExpiring(p.expiresAt)
                ? "no expiration"
                : `access until ${formatExpiry(p.expiresAt)}`}
            </Text>
          ))}

          <Button href={inviteUrl} style={cta}>
            Accept invite
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
  margin: "0 0 16px",
  lineHeight: "1.5",
};

const projectLine: React.CSSProperties = {
  fontSize: "15px",
  color: "#000000",
  margin: "0 0 6px",
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
  margin: "18px 0 32px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: "0",
  lineHeight: "1.5",
};
