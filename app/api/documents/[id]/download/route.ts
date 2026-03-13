import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const document = await db.document.findUnique({
    where: { id },
    include: {
      hire: {
        include: {
          business: { select: { ownerId: true } },
        },
      },
      currentVersion: { select: { filePath: true } },
    },
  })

  if (!document) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  // Verify the requesting user owns this business
  if (document.hire.business.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!document.currentVersion?.filePath) {
    return Response.json({ error: "No file available" }, { status: 404 })
  }

  const url = await getSignedDownloadUrl(document.currentVersion.filePath, 3600)

  return Response.json({ url })
}
