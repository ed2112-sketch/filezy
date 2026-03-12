import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Filezy — New hire paperwork, simplified",
  description:
    "Collect W-4, I-9, direct deposit, and offer letters from new hires via a simple mobile-friendly upload link.",
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
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
