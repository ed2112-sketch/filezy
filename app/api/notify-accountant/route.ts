import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getSignedDownloadUrl } from "@/lib/storage"

const TWENTY_FOUR_HOURS = 24 * 60 * 60

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { hireId } = body as { hireId?: string }

    if (!hireId) {
      return NextResponse.json(
        { error: "hireId is required" },
        { status: 400 }
      )
    }

    // Fetch hire with business and documents
    const hire = await db.hire.findUnique({
      where: { id: hireId },
      include: {
        business: {
          include: {
            referredByAccountant: true,
          },
        },
        documents: {
            include: { currentVersion: { select: { fileName: true, filePath: true } } },
          },
      },
    })

    if (!hire) {
      return NextResponse.json(
        { error: "Hire not found" },
        { status: 404 }
      )
    }

    // Verify the authenticated user owns the business
    if (hire.business.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not own this business" },
        { status: 403 }
      )
    }

    if (!hire.business.referredByAccountant) {
      return NextResponse.json(
        { error: "Business does not have a linked accountant" },
        { status: 400 }
      )
    }

    // Generate signed download URLs for each document (24hr expiry)
    const documentLinks = await Promise.all(
      hire.documents
        .filter((doc) => doc.currentVersion?.filePath)
        .map(async (doc) => ({
          id: doc.id,
          docType: doc.docType,
          fileName: doc.currentVersion?.fileName ?? null,
          downloadUrl: await getSignedDownloadUrl(doc.currentVersion!.filePath, TWENTY_FOUR_HOURS),
        }))
    )

    // Update hire to mark accountant as notified
    await db.hire.update({
      where: { id: hireId },
      data: { accountantNotifiedAt: new Date() },
    })

    // TODO: Send email to accountant with document links via Resend
    // For now, return the download links

    return NextResponse.json({
      success: true,
      hire: {
        id: hire.id,
        employeeName: hire.employeeName,
        position: hire.position,
      },
      business: {
        id: hire.business.id,
        name: hire.business.name,
      },
      accountant: {
        id: hire.business.referredByAccountant.id,
        email: hire.business.referredByAccountant.email,
        name: hire.business.referredByAccountant.name,
      },
      documents: documentLinks,
    })
  } catch (error) {
    console.error("Notify accountant error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
