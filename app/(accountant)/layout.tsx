import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AccountantShell } from "./accountant-shell"

export default async function AccountantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const accountant = await db.accountant.findUnique({
    where: { userId: session.user.id },
  })
  if (!accountant) redirect("/portal/join")

  return (
    <AccountantShell
      accountantName={accountant.name ?? session.user.name ?? "Accountant"}
      firmName={accountant.firmName ?? undefined}
    >
      {children}
    </AccountantShell>
  )
}
