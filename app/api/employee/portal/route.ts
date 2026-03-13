import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { DOCUMENT_TYPES } from "@/lib/documents"

export async function GET(request: NextRequest) {
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

  const employee = session.employee

  const hires = await db.hire.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        select: {
          id: true,
          docType: true,
          currentVersionId: true,
          createdAt: true,
        },
      },
      business: {
        select: {
          name: true,
          brandLogoUrl: true,
          brandPrimaryColor: true,
        },
      },
    },
  })

  const hiresData = hires.map((hire) => {
    const requiredDocTypes = (hire.requiredDocTypes as string[]) || []
    const uploadedDocTypes = new Set(
      hire.documents
        .filter((d) => d.currentVersionId)
        .map((d) => d.docType)
    )

    const docs = requiredDocTypes.map((dt) => {
      const meta = DOCUMENT_TYPES[dt as keyof typeof DOCUMENT_TYPES]
      return {
        docType: dt,
        label: meta?.label ?? dt,
        uploaded: uploadedDocTypes.has(dt),
      }
    })

    return {
      id: hire.id,
      businessName: hire.business.name,
      brandLogoUrl: hire.business.brandLogoUrl,
      brandPrimaryColor: hire.business.brandPrimaryColor,
      employeeName: hire.employeeName,
      position: hire.position,
      status: hire.status,
      completionPct: hire.completionPct,
      uploadToken: hire.uploadToken,
      createdAt: hire.createdAt.toISOString(),
      documents: docs,
    }
  })

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    },
    hires: hiresData,
  })
}
