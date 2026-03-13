import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Filezy - Stop Chasing Onboarding Paperwork",
  description:
    "Collect documents, e-signatures, and tax forms from new hires, clients, or workers. E-sign, document vault, white-label branding, and CSV bulk invites - all on every plan.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : "https://filezy.com"
  ),
  openGraph: {
    title: "Filezy - Stop Chasing Onboarding Paperwork",
    description:
      "Collect documents, e-signatures, and tax forms from new hires, clients, or workers. Built for employers, accountants, and staffing agencies.",
    url: "/",
    siteName: "Filezy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Filezy - Stop Chasing Onboarding Paperwork",
    description:
      "Collect documents, e-signatures, and tax forms. E-sign, document vault, white-label branding, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
