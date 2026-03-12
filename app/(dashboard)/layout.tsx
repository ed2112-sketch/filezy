import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) redirect("/signup")

  return (
    <DashboardShell
      userName={session.user.name ?? session.user.email ?? "User"}
      userEmail={session.user.email ?? ""}
      userImage={session.user.image ?? undefined}
    >
      {children}
    </DashboardShell>
  )
}
