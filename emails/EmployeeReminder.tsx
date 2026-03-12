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

interface EmployeeReminderProps {
  employeeName: string
  businessName: string
  uploadUrl: string
  completionPct: number
  remainingDocs: string[]
}

export default function EmployeeReminder({
  employeeName,
  businessName,
  uploadUrl,
  completionPct,
  remainingDocs,
}: EmployeeReminderProps) {
  const previewText = `Reminder: ${businessName} is waiting on your documents`

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
          <Heading style={heading}>You're almost there!</Heading>
          <Text style={text}>Hi {employeeName},</Text>
          <Text style={text}>
            <strong>{businessName}</strong> is still waiting on a few documents
            from you. You're {completionPct}% done — just a little more to go.
          </Text>
          <Text style={text}>Here's what's still needed:</Text>
          <Section style={listSection}>
            {remainingDocs.map((doc, i) => (
              <Text key={i} style={listItem}>
                {doc}
              </Text>
            ))}
          </Section>
          <Section style={progressOuter}>
            <Section
              style={{
                ...progressInner,
                width: `${completionPct}%`,
              }}
            />
          </Section>
          <Text style={progressLabel}>{completionPct}% complete</Text>
          <Section style={buttonSection}>
            <Button style={button} href={uploadUrl}>
              Finish Uploading
            </Button>
          </Section>
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
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
}

const listItem: React.CSSProperties = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 6px",
  paddingLeft: "8px",
  borderLeft: "3px solid #f59e0b",
}

const progressOuter: React.CSSProperties = {
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  height: "8px",
  margin: "16px 0 4px",
  overflow: "hidden",
}

const progressInner: React.CSSProperties = {
  backgroundColor: "#136334",
  borderRadius: "4px",
  height: "8px",
}

const progressLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0 0 16px",
  textAlign: "center" as const,
}

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "20px 0 16px",
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
