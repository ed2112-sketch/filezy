import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/storage"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const sessionToken = request.cookies.get("employee_session")?.value

  if (!sessionToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const session = await db.employeeSession.findUnique({
    where: { token: sessionToken },
    include: { employee: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Session expired" },
      { status: 401 }
    )
  }

  const document = await db.document.findUnique({
    where: { id },
    include: {
      currentVersion: true,
      hire: {
        select: { employeeId: true },
      },
    },
  })

  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    )
  }

  if (document.hire.employeeId !== session.employee.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  if (!document.currentVersion) {
    return NextResponse.json(
      { error: "No file available for this document" },
      { status: 404 }
    )
  }

  const url = await getSignedDownloadUrl(document.currentVersion.filePath)

  return NextResponse.json({ url })
}
