import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

export const subject = (projectName: string) =>
  `Your request for ${projectName} access`;

interface AccessDeniedEmailProps {
  userName: string;
  projectName: string;
}

export default function AccessDeniedEmail({
  userName,
  projectName,
}: AccessDeniedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your request for {projectName} access</Preview>
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
            Your request for access to <strong>{projectName}</strong> has not
            been approved at this time. If you believe this is an error, please
            reach out directly.
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
  margin: "0",
  lineHeight: "1.5",
};
