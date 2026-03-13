import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { DOCUMENT_TYPES } from "@/lib/documents"
import { ReportsDashboard } from "./reports-dashboard"

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) redirect("/signup")

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

  // Average completion time
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

  const docsByType: Record<string, number> = {}
  for (const doc of documents) {
    const label =
      DOCUMENT_TYPES[doc.docType as keyof typeof DOCUMENT_TYPES]?.label ??
      doc.docType
    docsByType[label] = (docsByType[label] ?? 0) + 1
  }

  // Recent completions
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

  return (
    <ReportsDashboard
      stats={{
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
      }}
      recentCompletions={recentCompletions.map((h) => ({
        id: h.id,
        employeeName: h.employeeName,
        employeeEmail: h.employeeEmail,
        position: h.position,
        completionPct: h.completionPct,
        createdAt: h.createdAt.toISOString(),
        updatedAt: h.updatedAt.toISOString(),
      }))}
    />
  )
}
