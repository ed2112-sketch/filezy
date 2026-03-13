import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import Link from "next/link"
import { Plus, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkFeatureAccess } from "@/lib/plans"
import HiresList, { type SerializedHire } from "./hires-list"
import { getWorkflowLabels } from "@/lib/workflow-labels"

export default async function HiresPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      plan: true,
      workflowType: true,
    },
  })
  if (!business) redirect("/signup")

  const labels = getWorkflowLabels(business.workflowType)

  const [hires, locations] = await Promise.all([
    db.hire.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        documents: {
          include: {
            expiration: { select: { expiresAt: true, isResolved: true } },
          },
        },
        location: { select: { id: true, name: true } },
      },
    }),
    db.location.findMany({
      where: { businessId: business.id },
      select: { id: true, name: true },
    }),
  ])

  const now = new Date()

  const serializedHires: SerializedHire[] = hires.map((hire) => {
    const uploadedDocTypes = hire.documents.map((d) => d.docType)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const hasExpiringDocs = hire.documents.some(
      (d) =>
        d.expiration &&
        !d.expiration.isResolved &&
        d.expiration.expiresAt >= now &&
        d.expiration.expiresAt <= thirtyDaysFromNow
    )
    return {
      id: hire.id,
      employeeName: hire.employeeName,
      employeeEmail: hire.employeeEmail,
      position: hire.position,
      status: hire.status,
      completionPct: hire.completionPct,
      createdAt: hire.createdAt.toISOString(),
      locationId: hire.location?.id ?? null,
      locationName: hire.location?.name ?? null,
      uploadedDocTypes,
      hasExpiringDocs,
    }
  })

  const bulkDownloadEnabled = checkFeatureAccess(business.plan, "bulkDownload")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{labels.hires}</h1>
          <p className="text-muted-foreground mt-1">
            Manage {labels.onboarding.toLowerCase()} for {business.name}
          </p>
        </div>
        <Link href="/hires/new">
          <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
            <Plus className="h-4 w-4" />
            {labels.addHire}
          </Button>
        </Link>
      </div>

      {hires.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[#136334]/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-[#136334]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No {labels.hires.toLowerCase()} yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add your first {labels.hire.toLowerCase()} to start collecting their documents
              automatically.
            </p>
            <Link href="/hires/new">
              <Button className="gap-2 bg-[#136334] hover:bg-[#136334]/90">
                <Plus className="h-4 w-4" />
                {labels.addHire}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <HiresList
          hires={serializedHires}
          locations={locations}
          bulkDownloadEnabled={bulkDownloadEnabled}
          businessName={business.name}
          labels={labels}
        />
      )}
    </div>
  )
}
