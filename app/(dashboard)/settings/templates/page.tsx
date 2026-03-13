import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import TemplatesManager from "./templates-manager"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  if (!business) redirect("/login")

  const templates = await db.roleTemplate.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  })

  const serialized = templates.map((t) => ({
    id: t.id,
    name: t.name,
    docTypes: Array.isArray(t.docTypes) ? (t.docTypes as string[]) : [],
    createdAt: t.createdAt,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Role Templates</h1>
        <p className="text-muted-foreground mt-1">
          Create templates to quickly assign required documents when onboarding new hires.
        </p>
      </div>

      <TemplatesManager initialTemplates={serialized} />
    </div>
  )
}
