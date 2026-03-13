import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkHireLimit } from "@/lib/plans"
import { DEFAULT_TEMPLATES } from "@/lib/default-templates"
import { getResend } from "@/lib/resend"
import { render } from "@react-email/components"
import EmployeeInvite from "@/emails/EmployeeInvite"
import type { WorkflowType } from "@/lib/generated/prisma/client"
import { logAudit, extractRequestInfo } from "@/lib/audit"

export async function GET() {
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

  const hires = await db.hire.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    include: { documents: true },
  })

  return NextResponse.json(hires)
}

async function getRequiredDocTypes(businessId: string, workflowType: WorkflowType, roleTemplateId?: string): Promise<string[]> {
  // If a specific role template is provided, use its doc types
  if (roleTemplateId) {
    const template = await db.roleTemplate.findUnique({
      where: { id: roleTemplateId },
      select: { docTypes: true },
    })
    if (template && Array.isArray(template.docTypes)) {
      return template.docTypes as string[]
    }
  }

  // Otherwise find the first template for this business
  const defaultTemplate = await db.roleTemplate.findFirst({
    where: { businessId },
    select: { docTypes: true },
  })
  if (defaultTemplate && Array.isArray(defaultTemplate.docTypes) && (defaultTemplate.docTypes as string[]).length > 0) {
    return defaultTemplate.docTypes as string[]
  }

  // Fall back to the hardcoded default for this workflow type
  return DEFAULT_TEMPLATES[workflowType].docTypes
}

export async function POST(request: NextRequest) {
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

  // Check plan limits
  const withinLimit = await checkHireLimit(business.id, business.plan)
  if (!withinLimit) {
    return NextResponse.json(
      {
        error:
          "You've reached your plan's hire limit. Please upgrade to add more hires.",
      },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { employeeName, employeeEmail, employeePhone, position, startDate, roleTemplateId, locationId } =
    body

  if (!employeeName || typeof employeeName !== "string") {
    return NextResponse.json(
      { error: "Employee name is required." },
      { status: 400 }
    )
  }

  const requiredDocTypes = await getRequiredDocTypes(business.id, business.workflowType, roleTemplateId)

  const hire = await db.hire.create({
    data: {
      businessId: business.id,
      employeeName: employeeName.trim(),
      employeeEmail: employeeEmail?.trim() || null,
      employeePhone: employeePhone?.trim() || null,
      position: position?.trim() || null,
      startDate: startDate ? new Date(startDate) : null,
      roleTemplateId: roleTemplateId || null,
      locationId: locationId || null,
      requiredDocTypes,
    },
  })

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`

  const { ip, userAgent } = extractRequestInfo(request)
  await logAudit({
    businessId: business.id,
    hireId: hire.id,
    action: "HIRE_CREATED",
    actorType: "ADMIN",
    actorId: session.user.id,
    ip,
    userAgent,
    metadata: { employeeName: hire.employeeName, position: hire.position ?? undefined },
  })

  // Send invite email if we have an email address (fire and forget)
  const email = employeeEmail?.trim()
  if (email) {
    render(EmployeeInvite({
      employeeName: employeeName.trim(),
      businessName: business.name,
      uploadUrl,
      position: position?.trim() || undefined,
    })).then((html) => {
      getResend().emails.send({
        from: `${business.name} via Filezy <noreply@filezy.com>`,
        to: email,
        subject: `${business.name} - Document upload request`,
        html,
      })
    }).catch((err) => console.error("Invite email failed:", err))
  }

  return NextResponse.json({ hire, uploadUrl }, { status: 201 })
}
