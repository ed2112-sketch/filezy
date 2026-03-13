import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { TeamManager } from "./team-manager"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business || !user) redirect("/signup")

  const [owner, members] = await Promise.all([
    db.user.findUnique({
      where: { id: business.ownerId },
      select: { id: true, name: true, email: true, role: true },
    }),
    db.user.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true, email: true, role: true },
    }),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team members and their roles.
        </p>
      </div>
      <TeamManager
        currentUserRole={user.role}
        initialOwner={owner}
        initialMembers={members}
      />
    </div>
  )
}
