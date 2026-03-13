import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/storage"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, versionId } = await params

  const version = await db.documentVersion.findUnique({
    where: { id: versionId },
    include: {
      document: {
        include: {
          hire: {
            include: {
              business: { select: { ownerId: true } },
            },
          },
        },
      },
    },
  })

  if (!version || version.documentId !== id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  if (version.document.hire.business.ownerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = await getSignedDownloadUrl(version.filePath, 3600)

  return Response.json({ url })
}
