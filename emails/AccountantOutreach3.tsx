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

export default function AccountantOutreach3() {
  const previewText = "Last thing — Filezy partner program"

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
          <Heading style={heading}>One last note from us</Heading>
          <Text style={text}>Hi,</Text>
          <Text style={text}>
            We've reached out a couple of times about the Filezy Partner
            Program, and we wanted to give it one last mention before we move on.
          </Text>
          <Text style={text}>
            If you work with small businesses that hire employees, our partner
            program pays <strong>20-30% recurring commission</strong> for every
            client you refer. No minimums, no commitments — just a referral link
            and passive income.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href="https://filezy.com/partners">
              Join Now
            </Button>
          </Section>
          <Text style={note}>
            This is our last email about this. No hard feelings.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because a Filezy client listed you as their
            accountant. This is our final email — you won't hear from us about
            this again.{" "}
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

const note: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 24px",
  textAlign: "center" as const,
  fontStyle: "italic",
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
