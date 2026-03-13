import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/storage"
import { logAudit, extractRequestInfo } from "@/lib/audit"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, versionId } = await params

  // Enforce documentId at the DB layer to prevent IDOR
  const version = await db.documentVersion.findFirst({
    where: { id: versionId, documentId: id },
    include: {
      document: {
        include: {
          hire: {
            select: { businessId: true },
          },
        },
      },
    },
  })

  if (!version) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  // Verify user belongs to this business (owner or team member)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })

  const userBusinessId = user?.ownedBusiness?.id ?? user?.business?.id
  if (!userBusinessId || userBusinessId !== version.document.hire.businessId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = await getSignedDownloadUrl(version.filePath, 3600)

  const { ip, userAgent } = extractRequestInfo(_req)
  await logAudit({
    businessId: version.document.hire.businessId,
    hireId: version.document.hireId,
    documentId: version.documentId,
    action: "DOWNLOADED",
    actorType: "ADMIN",
    actorId: session.user.id,
    ip,
    userAgent,
    metadata: { versionId },
  })

  return Response.redirect(url, 302)
}
