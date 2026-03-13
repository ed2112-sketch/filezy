import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { logAudit, extractRequestInfo } from "@/lib/audit"
import { DOCUMENT_TYPES, REQUIRED_DOC_TYPES } from "@/lib/documents"

function csvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) {
    return Response.json({ error: "No business" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  if (!type || !["completion", "compliance", "summary"].includes(type)) {
    return Response.json({ error: "Invalid report type" }, { status: 400 })
  }

  const reqInfo = extractRequestInfo(request)

  if (type === "completion") {
    const hires = await db.hire.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    })

    const columns = [
      "Employee Name",
      "Email",
      "Position",
      "Status",
      "Completion %",
      "Created Date",
      "Completed Date",
    ]

    const rows: string[] = [columns.map(csvField).join(",")]

    for (const hire of hires) {
      const completedDate =
        hire.status === "COMPLETE"
          ? hire.updatedAt.toISOString().slice(0, 10)
          : ""

      rows.push(
        [
          csvField(hire.employeeName),
          csvField(hire.employeeEmail),
          csvField(hire.position),
          csvField(hire.status),
          csvField(hire.completionPct),
          csvField(hire.createdAt.toISOString().slice(0, 10)),
          csvField(completedDate),
        ].join(",")
      )
    }

    await logAudit({
      businessId: business.id,
      action: "REPORT_GENERATED",
      actorType: "ADMIN",
      actorId: session.user.id,
      metadata: { reportType: "completion" },
      ...reqInfo,
    })

    return new Response(rows.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="completion-report.csv"',
      },
    })
  }

  if (type === "compliance") {
    const hires = await db.hire.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: { documents: true },
    })

    const columns = ["Employee Name", "Missing Document", "Hire Status"]
    const rows: string[] = [columns.map(csvField).join(",")]

    for (const hire of hires) {
      const uploadedTypes = new Set(hire.documents.map((d) => d.docType))
      const requiredTypes: string[] =
        Array.isArray(hire.requiredDocTypes) &&
        (hire.requiredDocTypes as string[]).length > 0
          ? (hire.requiredDocTypes as string[])
          : [...REQUIRED_DOC_TYPES]

      for (const docType of requiredTypes) {
        if (!uploadedTypes.has(docType)) {
          const label =
            DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES]?.label ??
            docType
          rows.push(
            [
              csvField(hire.employeeName),
              csvField(label),
              csvField(hire.status),
            ].join(",")
          )
        }
      }
    }

    await logAudit({
      businessId: business.id,
      action: "REPORT_GENERATED",
      actorType: "ADMIN",
      actorId: session.user.id,
      metadata: { reportType: "compliance" },
      ...reqInfo,
    })

    return new Response(rows.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="compliance-report.csv"',
      },
    })
  }

  // type === "summary"
  const [totalHires, pendingCount, inProgressCount, completeCount, expiredCount, documents] =
    await Promise.all([
      db.hire.count({ where: { businessId: business.id } }),
      db.hire.count({ where: { businessId: business.id, status: "PENDING" } }),
      db.hire.count({ where: { businessId: business.id, status: "IN_PROGRESS" } }),
      db.hire.count({ where: { businessId: business.id, status: "COMPLETE" } }),
      db.hire.count({ where: { businessId: business.id, status: "EXPIRED" } }),
      db.document.findMany({
        where: { hire: { businessId: business.id } },
        select: { docType: true },
      }),
    ])

  // Calculate average completion time for completed hires
  const completedHires = await db.hire.findMany({
    where: { businessId: business.id, status: "COMPLETE" },
    select: { createdAt: true, updatedAt: true },
  })

  let avgCompletionDays = 0
  if (completedHires.length > 0) {
    const totalDays = completedHires.reduce((sum, hire) => {
      const days =
        (hire.updatedAt.getTime() - hire.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
      return sum + days
    }, 0)
    avgCompletionDays = Math.round((totalDays / completedHires.length) * 10) / 10
  }

  const completionRate =
    totalHires > 0 ? Math.round((completeCount / totalHires) * 100) : 0

  // Count documents by type
  const docsByType: Record<string, number> = {}
  for (const doc of documents) {
    const label =
      DOCUMENT_TYPES[doc.docType as keyof typeof DOCUMENT_TYPES]?.label ??
      doc.docType
    docsByType[label] = (docsByType[label] ?? 0) + 1
  }

  // Recent completions (last 10)
  const recentCompletions = await db.hire.findMany({
    where: { businessId: business.id, status: "COMPLETE" },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      employeeName: true,
      employeeEmail: true,
      position: true,
      completionPct: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  await logAudit({
    businessId: business.id,
    action: "REPORT_GENERATED",
    actorType: "ADMIN",
    actorId: session.user.id,
    metadata: { reportType: "summary" },
    ...reqInfo,
  })

  return Response.json({
    totalHires,
    byStatus: {
      pending: pendingCount,
      inProgress: inProgressCount,
      complete: completeCount,
      expired: expiredCount,
    },
    completionRate,
    avgCompletionDays,
    docsByType,
    recentCompletions,
  })
}
