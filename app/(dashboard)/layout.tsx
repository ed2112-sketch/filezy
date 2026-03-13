import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DashboardShell } from "./dashboard-shell"
import { getWorkflowLabels } from "@/lib/workflow-labels"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business || !user) redirect("/signup")

  const labels = getWorkflowLabels(business.workflowType)

  return (
    <DashboardShell
      userName={user.name ?? user.email ?? "User"}
      userEmail={user.email ?? ""}
      userImage={user.image ?? undefined}
      user={{ name: user.name, email: user.email, image: user.image, role: user.role }}
      hiresLabel={labels.hires}
    >
      {children}
    </DashboardShell>
  )
}
