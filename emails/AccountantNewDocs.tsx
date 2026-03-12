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

interface AccountantNewDocsProps {
  accountantName?: string
  businessName: string
  employeeName: string
  position?: string
  documentLinks: { label: string; url: string }[]
}

export default function AccountantNewDocs({
  accountantName,
  businessName,
  employeeName,
  position,
  documentLinks,
}: AccountantNewDocsProps) {
  const previewText = `New hire documents ready — ${employeeName} at ${businessName}`

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
          <Heading style={heading}>New hire documents ready</Heading>
          <Text style={text}>
            {accountantName ? `Hi ${accountantName},` : "Hello,"}
          </Text>
          <Text style={text}>
            All documents for <strong>{employeeName}</strong>
            {position ? ` (${position})` : ""} at{" "}
            <strong>{businessName}</strong> have been collected and are ready for
            your review.
          </Text>
          <Text style={text}>Documents available:</Text>
          <Section style={docList}>
            {documentLinks.map((doc, i) => (
              <Text key={i} style={docItem}>
                <Link href={doc.url} style={docLink}>
                  {doc.label}
                </Link>
              </Text>
            ))}
          </Section>
          <Hr style={hr} />
          {!accountantName && (
            <Section style={partnerSection}>
              <Text style={partnerHeading}>
                Want to earn commission for every client you refer?
              </Text>
              <Text style={partnerText}>
                The Filezy Partner Program lets accountants and bookkeepers earn
                20-30% recurring commission on every client they bring to the
                platform.
              </Text>
              <Button
                style={partnerButton}
                href="https://filezy.com/partners"
              >
                Learn About the Partner Program
              </Button>
            </Section>
          )}
          <Text style={footer}>
            This email was sent by{" "}
            <Link href="https://filezy.com" style={link}>
              Filezy
            </Link>
            . You're receiving this because {businessName} listed you as their
            accountant.
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

const docList: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
}

const docItem: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px",
  paddingLeft: "8px",
  borderLeft: "3px solid #136334",
}

const docLink: React.CSSProperties = {
  color: "#136334",
  fontWeight: 600,
  textDecoration: "underline",
}

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderStyle: "solid",
  borderWidth: "1px 0 0",
  margin: "24px 0",
}

const partnerSection: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "20px",
  margin: "0 0 24px",
  textAlign: "center" as const,
}

const partnerHeading: React.CSSProperties = {
  color: "#111827",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "1.4",
  margin: "0 0 8px",
}

const partnerText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 16px",
}

const partnerButton: React.CSSProperties = {
  backgroundColor: "#136334",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "1",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
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
