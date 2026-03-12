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

interface EmployeeInviteProps {
  employeeName: string
  businessName: string
  uploadUrl: string
  position?: string
}

export default function EmployeeInvite({
  employeeName,
  businessName,
  uploadUrl,
  position,
}: EmployeeInviteProps) {
  const previewText = `${businessName} needs a few documents from you`

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
            Welcome aboard{position ? ` as ${position}` : ""}!
          </Heading>
          <Text style={text}>Hi {employeeName},</Text>
          <Text style={text}>
            <strong>{businessName}</strong> is using Filezy to collect your new
            hire paperwork. We just need a few things from you to get everything
            set up.
          </Text>
          <Text style={text}>Here's what you'll need to upload:</Text>
          <Section style={listSection}>
            <Text style={listItem}>W-4 (federal tax withholding form)</Text>
            <Text style={listItem}>Photo of your government-issued ID</Text>
            <Text style={listItem}>Direct deposit information</Text>
            <Text style={listItem}>Signed offer letter</Text>
          </Section>
          <Section style={buttonSection}>
            <Button style={button} href={uploadUrl}>
              Upload Your Documents
            </Button>
          </Section>
          <Text style={note}>
            This takes about 5 minutes from your phone.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            This email was sent by{" "}
            <Link href="https://filezy.com" style={link}>
              Filezy
            </Link>{" "}
            on behalf of {businessName}. If you have questions, reach out to
            your employer directly.
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

const listSection: React.CSSProperties = {
  backgroundColor: "#f9fafb",
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
  margin: "28px 0 16px",
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
  fontSize: "13px",
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
