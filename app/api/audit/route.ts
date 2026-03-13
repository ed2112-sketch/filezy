import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { AuditAction } from "@/lib/generated/prisma/client"

export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
  const action = searchParams.get("action") as AuditAction | null
  const hireId = searchParams.get("hireId")

  const where: Record<string, unknown> = { businessId: business.id }
  if (action && Object.values(AuditAction).includes(action)) {
    where.action = action
  }
  if (hireId) {
    where.hireId = hireId
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  // Resolve hire names for logs that reference a hire
  const hireIds = [...new Set(logs.filter((l) => l.hireId).map((l) => l.hireId!))]
  const hires = hireIds.length > 0
    ? await db.hire.findMany({
        where: { id: { in: hireIds } },
        select: { id: true, employeeName: true },
      })
    : []
  const hireMap = new Map(hires.map((h) => [h.id, h.employeeName]))

  const logsWithHires = logs.map((log) => ({
    ...log,
    hireName: log.hireId ? hireMap.get(log.hireId) ?? null : null,
  }))

  return NextResponse.json({
    logs: logsWithHires,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
