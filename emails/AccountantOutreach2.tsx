import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Link,
  Img,
  Preview,
} from "@react-email/components"

interface AccountantOutreach2Props {
  businessName?: string
}

export default function AccountantOutreach2({
  businessName,
}: AccountantOutreach2Props) {
  const previewText =
    "How much could you earn referring your clients to Filezy?"

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src="https://filezy.com/logo.png"
            width="120"
            height="36"
            alt="Filezy"
            style={logo}
          />
          <Heading style={heading}>
            How much could you earn with Filezy?
          </Heading>
          <Text style={text}>Hi again,</Text>
          {businessName && (
            <Text style={text}>
              We reached out recently because <strong>{businessName}</strong>{" "}
              listed you as their accountant on Filezy. We wanted to follow up
              with some numbers.
            </Text>
          )}
          <Text style={text}>
            Accountants in our partner program earn{" "}
            <strong>20-30% recurring commission</strong> on every client they
            refer. Here's what that could look like:
          </Text>
          <Section style={calcSection}>
            <Section style={calcRow}>
              <Text style={calcClients}>5 clients</Text>
              <Text style={calcEarning}>$50 - $150/mo</Text>
            </Section>
            <Hr style={calcDivider} />
            <Section style={calcRow}>
              <Text style={calcClients}>10 clients</Text>
              <Text style={calcEarning}>$100 - $300/mo</Text>
            </Section>
            <Hr style={calcDivider} />
            <Section style={calcRow}>
              <Text style={calcClients}>20 clients</Text>
              <Text style={calcEarning}>$200 - $600/mo</Text>
            </Section>
          </Section>
          <Text style={text}>
            That's passive income for recommending a tool your clients already
            need. No sales calls, no extra work — just share your referral link.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href="https://filezy.com/partners">
              Join the Partner Program
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because a Filezy client listed you as their
            accountant. We'll only send one more email about this.{" "}
            <Link href="https://filezy.com/unsubscribe" style={link}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "40px auto",
  padding: "40px 32px",
  maxWidth: "520px",
}

const logo: React.CSSProperties = {
  marginBottom: "24px",
}

const heading: React.CSSProperties = {
  color: "#111827",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 16px",
}

const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
}

const calcSection: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "20px 0",
  border: "1px solid #bbf7d0",
}

const calcRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
}

const calcClients: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  fontWeight: 600,
  margin: 0,
}

const calcEarning: React.CSSProperties = {
  color: "#136334",
  fontSize: "16px",
  fontWeight: 700,
  margin: 0,
}

const calcDivider: React.CSSProperties = {
  borderColor: "#d1fae5",
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "0",
}

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
}

const button: React.CSSProperties = {
  backgroundColor: "#136334",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "1",
  padding: "14px 32px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "24px 0",
}

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: 0,
}

const link: React.CSSProperties = {
  color: "#136334",
  textDecoration: "underline",
}
