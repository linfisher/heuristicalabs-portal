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

export const subject = (projectName: string, requesterName: string) =>
  `[${projectName}] access request from ${requesterName}`;

interface AccessRequestEmailProps {
  requesterName: string;
  requesterEmail: string;
  requesterClerkId: string;
  projectName: string;
  message?: string;
  tokens: {
    h24: string;
    d3: string;
    d7: string;
    d30: string;
  };
  denyUrl: string;
}

export default function AccessRequestEmail({
  requesterName,
  requesterEmail,
  requesterClerkId,
  projectName,
  message,
  tokens,
  denyUrl,
}: AccessRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        [{projectName}] access request from {requesterName}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://www.heuristicalabs.com/logo.png"
            width="120"
            alt="Heuristica Labs"
            style={logo}
          />

          <Text style={heading}>Access request: {projectName}</Text>

          <Text style={text}>
            <strong>From:</strong> {requesterName} &lt;{requesterEmail}&gt;
            <br />
            <strong>Clerk ID:</strong>{" "}
            <span style={mono}>{requesterClerkId}</span>
          </Text>

          {message && (
            <Section style={blockquote}>
              <Text style={blockquoteText}>&ldquo;{message}&rdquo;</Text>
            </Section>
          )}

          <Text style={label}>Grant access — select duration:</Text>

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
            Clicking a chip approves the request and notifies the user.
            <br />
            These links expire in 72 hours and are single-use.
          </Text>

          <Hr style={hr} />

          <Text style={text}>
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

const mono: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "13px",
  backgroundColor: "#f4f4f4",
  padding: "2px 6px",
  borderRadius: "3px",
};

const blockquote: React.CSSProperties = {
  borderLeft: "3px solid #e5e5e5",
  paddingLeft: "16px",
  margin: "0 0 20px",
};

const blockquoteText: React.CSSProperties = {
  fontSize: "14px",
  color: "#666666",
  fontStyle: "italic",
  margin: "0",
  lineHeight: "1.6",
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
