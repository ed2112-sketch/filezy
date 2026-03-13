import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAudit, extractRequestInfo } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const document = await db.document.findUnique({
    where: { id },
    include: {
      hire: {
        include: {
          business: true,
        },
      },
      versions: true,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Verify user belongs to this business (owner or team member)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })

  const userBusinessId = user?.ownedBusiness?.id ?? user?.business?.id
  if (!userBusinessId || userBusinessId !== document.hire.businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Find version with status PENDING_REVIEW
  const pendingVersion = document.versions.find(
    (v) => v.status === "PENDING_REVIEW"
  )

  if (!pendingVersion) {
    return NextResponse.json(
      { error: "No pending version to reject" },
      { status: 404 }
    )
  }

  // Update PENDING_REVIEW version to REJECTED (currentVersionId stays unchanged)
  await db.documentVersion.update({
    where: { id: pendingVersion.id },
    data: {
      status: "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  })

  const { ip, userAgent } = extractRequestInfo(request)
  await logAudit({
    businessId: document.hire.businessId,
    hireId: document.hireId,
    documentId: id,
    action: "REJECTED",
    actorType: "ADMIN",
    actorId: session.user.id,
    ip,
    userAgent,
  })

  return NextResponse.json({ success: true })
}
