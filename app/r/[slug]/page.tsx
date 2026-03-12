import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"

export default async function ReferralRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const referralLink = await db.referralLink.findUnique({
    where: { slug },
  })

  if (!referralLink) {
    notFound()
  }

  // Increment clicks counter
  await db.referralLink.update({
    where: { id: referralLink.id },
    data: { clicks: { increment: 1 } },
  })

  redirect(`/signup?ref=${referralLink.accountantId}`)
}
