import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { DEFAULT_TEMPLATES } from "@/lib/default-templates"
import { WorkflowType } from "@/lib/generated/prisma/client"

const VALID_WORKFLOW_TYPES: WorkflowType[] = ["EMPLOYER", "ACCOUNTANT", "STAFFING_AGENCY"]

export async function POST(req: NextRequest) {
  const { name, email, password, businessName, workflowType = "EMPLOYER", referredByAccountantId } = await req.json()

  if (!email || !password || !name || !businessName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!VALID_WORKFLOW_TYPES.includes(workflowType as WorkflowType)) {
    return Response.json({ error: "Invalid workflow type" }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: "Email already registered" }, { status: 409 })
  }

  // Validate referral accountant if provided
  let resolvedReferralAccountantId: string | null = null
  if (referredByAccountantId) {
    const referralAccountant = await db.accountant.findUnique({
      where: { id: referredByAccountantId },
    })
    if (referralAccountant) {
      resolvedReferralAccountantId = referralAccountant.id
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
      },
    })

    const business = await tx.business.create({
      data: {
        name: businessName,
        ownerId: user.id,
        workflowType: workflowType as WorkflowType,
        referredByAccountantId: resolvedReferralAccountantId,
      },
    })

    await tx.user.update({
      where: { id: user.id },
      data: { businessId: business.id },
    })

    await tx.location.create({
      data: {
        businessId: business.id,
        name: "Main Office",
        isDefault: true,
      },
    })

    const template = DEFAULT_TEMPLATES[workflowType as WorkflowType]
    const roleTemplate = await tx.roleTemplate.create({
      data: {
        businessId: business.id,
        name: template.name,
        docTypes: template.docTypes,
      },
    })
    await tx.business.update({
      where: { id: business.id },
      data: { defaultRoleTemplateId: roleTemplate.id },
    })

    // Increment referral counters if this business was referred
    if (resolvedReferralAccountantId) {
      await tx.accountant.update({
        where: { id: resolvedReferralAccountantId },
        data: { activeReferralCount: { increment: 1 } },
      })

      await tx.referralLink.updateMany({
        where: { accountantId: resolvedReferralAccountantId },
        data: { conversions: { increment: 1 } },
      })
    }

    return { user, business }
  })

  return Response.json({ success: true, userId: result.user.id })
}
