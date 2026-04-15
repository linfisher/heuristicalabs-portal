import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const subject = (projectName: string) =>
  `Grant access to ${projectName} — choose duration`;

interface GrantInviteEmailProps {
  userName: string;
  userEmail: string;
  projectName: string;
  projectDescription: string;
  tokens: {
    h24: string;
    d3: string;
    d7: string;
    d30: string;
  };
  denyUrl: string;
}

export default function GrantInviteEmail({
  userName,
  userEmail,
  projectName,
  projectDescription,
  tokens,
  denyUrl,
}: GrantInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Grant access to {projectName} — choose duration</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://www.heuristicalabs.com/logo.png"
            width="120"
            alt="Heuristica Labs"
            style={logo}
          />

          <Text style={heading}>Grant access to {projectName}</Text>

          <Text style={text}>
            <strong>User:</strong> {userName} &lt;{userEmail}&gt;
          </Text>

          <Text style={text}>{projectDescription}</Text>

          <Text style={label}>Select access duration:</Text>

          <Section style={chipRow}>
            <Button href={tokens.h24} style={chip}>
              24 hrs
            </Button>
            <Button href={tokens.d3} style={chip}>
              3 days
            </Button>
            <Button href={tokens.d7} style={chip}>
              7 days
            </Button>
            <Button href={tokens.d30} style={chip}>
              30 days
            </Button>
          </Section>

          <Text style={footnote}>
            Clicking a chip immediately grants access for that duration.
            <br />
            These links expire in 72 hours and are single-use.
          </Text>

          <Hr style={hr} />

          <Text style={text}>
            Not granting this access?{" "}
            <Link href={denyUrl} style={denyLink}>
              Deny &amp; notify user
            </Link>
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

const label: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#000000",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "24px 0 12px",
};

const chipRow: React.CSSProperties = {
  marginBottom: "20px",
};

const chip: React.CSSProperties = {
  backgroundColor: "#0A0A0A",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "4px",
  display: "inline-block",
  marginRight: "8px",
  textDecoration: "none",
};

const footnote: React.CSSProperties = {
  fontSize: "13px",
  color: "#666666",
  margin: "0 0 24px",
  lineHeight: "1.5",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e5e5",
  margin: "24px 0",
};

const denyLink: React.CSSProperties = {
  color: "#000000",
  textDecoration: "underline",
};
