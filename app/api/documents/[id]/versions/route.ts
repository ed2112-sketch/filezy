import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
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

  const versions = await db.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      status: true,
      uploadedAt: true,
      uploaderType: true,
      reviewerNotes: true,
    },
  })

  return NextResponse.json(versions)
}
