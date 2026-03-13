import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import AuditLogViewer from "./audit-log-viewer"

export default async function AuditPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!business) redirect("/signup")

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.auditLog.count({ where: { businessId: business.id } }),
  ])

  // Resolve hire names
  const hireIds = [...new Set(logs.filter((l) => l.hireId).map((l) => l.hireId!))]
  const hires = hireIds.length > 0
    ? await db.hire.findMany({
        where: { id: { in: hireIds } },
        select: { id: true, employeeName: true },
      })
    : []
  const hireMap = new Map(hires.map((h) => [h.id, h.employeeName]))

  const serializedLogs = logs.map((log) => ({
    ...log,
    metadata: (log.metadata as Record<string, unknown> | null) ?? null,
    createdAt: log.createdAt.toISOString(),
    hireName: log.hireId ? hireMap.get(log.hireId) ?? null : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          Track all activity across your business
        </p>
      </div>
      <AuditLogViewer
        initialLogs={serializedLogs}
        initialTotal={total}
      />
    </div>
  )
}
