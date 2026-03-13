import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAudit, extractRequestInfo } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: {
    signatureData?: {
      type?: string
      value?: string
      consentGiven?: boolean
      consentText?: string
    }
    uploadToken?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { signatureData, uploadToken } = body

  // Validate consentGiven
  if (!signatureData?.consentGiven) {
    return NextResponse.json(
      { error: "Consent is required to sign" },
      { status: 400 }
    )
  }

  // Determine auth method and find document
  if (uploadToken) {
    // Token-based auth (employee)
    const hire = await db.hire.findFirst({
      where: { uploadToken },
    })

    if (!hire) {
      return NextResponse.json({ error: "Invalid upload token" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id },
      include: {
        hire: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Document must belong to the hire associated with the token
    if (document.hireId !== hire.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Store signature data
    await db.document.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signatureData: {
          ...signatureData,
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          timestamp: new Date().toISOString(),
        } as object,
      },
    })

    // Log audit
    const { ip, userAgent } = extractRequestInfo(request)
    await logAudit({
      businessId: document.hire.businessId,
      hireId: document.hireId,
      documentId: id,
      action: "SIGNED",
      actorType: "EMPLOYEE",
      actorId: "upload-token",
      ip,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } else {
    // Session-based auth (admin)
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await db.document.findUnique({
      where: { id },
      include: {
        hire: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Verify document's hire belongs to the user's business
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { ownedBusiness: true, business: true },
    })

    const userBusiness = user?.ownedBusiness ?? user?.business
    if (!userBusiness || userBusiness.id !== document.hire.businessId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Store signature data
    await db.document.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signatureData: {
          ...signatureData,
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          timestamp: new Date().toISOString(),
        } as object,
      },
    })

    // Log audit
    const { ip, userAgent } = extractRequestInfo(request)
    await logAudit({
      businessId: document.hire.businessId,
      hireId: document.hireId,
      documentId: id,
      action: "SIGNED",
      actorType: "ADMIN",
      actorId: session.user.id,
      ip,
      userAgent,
    })

    return NextResponse.json({ success: true })
  }
}
