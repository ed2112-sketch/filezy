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

interface AccountantOutreach1Props {
  accountantEmail: string
  businessName: string
}

export default function AccountantOutreach1({
  accountantEmail,
  businessName,
}: AccountantOutreach1Props) {
  const previewText = `${businessName} just used Filezy — and listed you as their accountant`

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
            {businessName} just used Filezy
          </Heading>
          <Text style={text}>Hi there,</Text>
          <Text style={text}>
            One of your clients, <strong>{businessName}</strong>, recently used
            Filezy to collect new hire documents — and they listed you as their
            accountant.
          </Text>
          <Text style={text}>
            <strong>What is Filezy?</strong> We help small businesses collect
            W-4s, ID photos, direct deposit info, and signed offer letters from
            new hires — all in one place, usually in under 5 minutes. No paper,
            no chasing people down.
          </Text>
          <Hr style={hr} />
          <Heading as="h2" style={subheading}>
            The Filezy Partner Program
          </Heading>
          <Text style={text}>
            We built a partner program specifically for accountants and
            bookkeepers. When you refer your clients to Filezy, you earn{" "}
            <strong>20-30% recurring commission</strong> for as long as they
            stay on the platform.
          </Text>
          <Text style={text}>Here's how it works:</Text>
          <Section style={listSection}>
            <Text style={listItem}>
              Share your referral link with clients
            </Text>
            <Text style={listItem}>
              They sign up and start collecting hire documents
            </Text>
            <Text style={listItem}>
              You earn recurring commission every month
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Button style={button} href="https://filezy.com/partners">
              Learn About the Partner Program
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This email was sent to {accountantEmail} because {businessName}{" "}
            listed this address as their accountant on Filezy. If this doesn't
            apply to you, you can safely ignore this email.
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

const subheading: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 12px",
}

const text: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
}

const listSection: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
}

const listItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 6px",
  paddingLeft: "8px",
  borderLeft: "3px solid #136334",
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
