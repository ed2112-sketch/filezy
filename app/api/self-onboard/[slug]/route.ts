import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { DEFAULT_TEMPLATES } from "@/lib/default-templates"
import { DOCUMENT_TYPES } from "@/lib/documents"
import type { WorkflowType } from "@/lib/generated/prisma/client"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const business = await db.business.findUnique({
    where: { selfOnboardingSlug: slug },
    select: {
      id: true,
      name: true,
      selfOnboardingEnabled: true,
      brandLogoUrl: true,
      brandPrimaryColor: true,
      brandAccentColor: true,
      workflowType: true,
      defaultRoleTemplateId: true,
    },
  })

  if (!business || !business.selfOnboardingEnabled) {
    return NextResponse.json(
      { error: "Not found or self-onboarding is disabled" },
      { status: 404 }
    )
  }

  // Get required doc types from default role template or workflow defaults
  let docTypes: string[] = []

  if (business.defaultRoleTemplateId) {
    const template = await db.roleTemplate.findUnique({
      where: { id: business.defaultRoleTemplateId },
      select: { docTypes: true },
    })
    if (template && Array.isArray(template.docTypes)) {
      docTypes = template.docTypes as string[]
    }
  }

  if (docTypes.length === 0) {
    docTypes = DEFAULT_TEMPLATES[business.workflowType as WorkflowType].docTypes
  }

  const docTypeInfo = docTypes.map((dt) => {
    const meta = DOCUMENT_TYPES[dt as keyof typeof DOCUMENT_TYPES]
    return {
      id: dt,
      label: meta?.label ?? dt,
      description: meta?.description ?? "",
    }
  })

  return NextResponse.json({
    businessName: business.name,
    brandLogoUrl: business.brandLogoUrl,
    brandPrimaryColor: business.brandPrimaryColor,
    brandAccentColor: business.brandAccentColor,
    requiredDocTypes: docTypeInfo,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const business = await db.business.findUnique({
    where: { selfOnboardingSlug: slug },
    select: {
      id: true,
      name: true,
      selfOnboardingEnabled: true,
      workflowType: true,
      defaultRoleTemplateId: true,
    },
  })

  if (!business || !business.selfOnboardingEnabled) {
    return NextResponse.json(
      { error: "Not found or self-onboarding is disabled" },
      { status: 404 }
    )
  }

  const body = await request.json()
  const { name, email, phone } = body

  if (!name || typeof name !== "string" || !email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    )
  }

  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName = name.trim()
  const trimmedPhone = phone?.trim() || null

  // Create or find employee
  let employee = await db.employee.findUnique({
    where: { email: trimmedEmail },
  })

  if (!employee) {
    employee = await db.employee.create({
      data: {
        email: trimmedEmail,
        name: trimmedName,
        phone: trimmedPhone,
      },
    })
  }

  // Get required doc types
  let requiredDocTypes: string[] = []

  if (business.defaultRoleTemplateId) {
    const template = await db.roleTemplate.findUnique({
      where: { id: business.defaultRoleTemplateId },
      select: { docTypes: true },
    })
    if (template && Array.isArray(template.docTypes)) {
      requiredDocTypes = template.docTypes as string[]
    }
  }

  if (requiredDocTypes.length === 0) {
    requiredDocTypes =
      DEFAULT_TEMPLATES[business.workflowType as WorkflowType].docTypes
  }

  // Create hire linked to employee and business
  const hire = await db.hire.create({
    data: {
      businessId: business.id,
      employeeName: trimmedName,
      employeeEmail: trimmedEmail,
      employeePhone: trimmedPhone,
      employeeId: employee.id,
      requiredDocTypes,
      selfOnboarded: true,
      roleTemplateId: business.defaultRoleTemplateId || null,
    },
  })

  const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/upload/${hire.uploadToken}`

  return NextResponse.json({ uploadUrl }, { status: 201 })
}
