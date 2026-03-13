import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getResend } from "@/lib/resend"
import { render } from "@react-email/components"
import EmployeeInvite from "@/emails/EmployeeInvite"
import AccountantNewDocs from "@/emails/AccountantNewDocs"
import { DOCUMENT_TYPES } from "@/lib/documents"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const hire = await db.hire.findUnique({
    where: { id },
    include: { documents: true },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  return NextResponse.json(hire)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 })
  }

  const hire = await db.hire.findUnique({
    where: { id },
  })

  if (!hire || hire.businessId !== business.id) {
    return NextResponse.json({ error: "Hire not found" }, { status: 404 })
  }

  const body = await request.json()

  // Handle special actions
  if (body.action === "resend_invite") {
    if (!hire.employeeEmail) {
      return NextResponse.json(
        { error: "No email address on file for this person." },
        { status: 400 }
      )
    }

    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`
    const html = await render(EmployeeInvite({
      employeeName: hire.employeeName,
      businessName: business.name,
      uploadUrl,
      position: hire.position ?? undefined,
    }))

    await getResend().emails.send({
      from: `${business.name} via Filezy <noreply@filezy.com>`,
      to: hire.employeeEmail,
      subject: `${business.name} - Document upload request`,
      html,
    })

    return NextResponse.json({ success: true, message: "Invite resent" })
  }

  if (body.action === "notify_accountant") {
    if (!business.accountantEmail) {
      return NextResponse.json(
        { error: "No accountant email configured. Add one in Settings." },
        { status: 400 }
      )
    }

    const hireWithDocs = await db.hire.findUnique({
      where: { id },
      include: {
        documents: {
          where: { currentVersionId: { not: null } },
          select: { docType: true, id: true },
        },
      },
    })

    const documentLinks = (hireWithDocs?.documents ?? []).map((d) => {
      const docTypeKey = d.docType as keyof typeof DOCUMENT_TYPES
      return {
        label: DOCUMENT_TYPES[docTypeKey]?.label ?? d.docType,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${d.id}/download`,
      }
    })

    const html = await render(AccountantNewDocs({
      accountantName: business.accountantName ?? undefined,
      businessName: business.name,
      employeeName: hire.employeeName,
      position: hire.position ?? undefined,
      documentLinks,
    }))

    await getResend().emails.send({
      from: `${business.name} via Filezy <noreply@filezy.com>`,
      to: business.accountantEmail,
      subject: `New hire documents ready - ${hire.employeeName} at ${business.name}`,
      html,
    })

    await db.hire.update({
      where: { id },
      data: { accountantNotifiedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: "Accountant notified",
    })
  }

  // Generic field updates
  const allowedFields = [
    "employeeName",
    "employeeEmail",
    "employeePhone",
    "position",
    "startDate",
  ] as const

  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "startDate") {
        updates[field] = body[field] ? new Date(body[field]) : null
      } else {
        updates[field] = body[field]?.trim() || null
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(hire)
  }

  const updated = await db.hire.update({
    where: { id },
    data: updates,
    include: { documents: true },
  })

  return NextResponse.json(updated)
}
