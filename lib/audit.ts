import { db } from "@/lib/db"
import type { AuditAction, ActorType } from "@/lib/generated/prisma/client"

interface AuditLogEntry {
  businessId: string
  hireId?: string
  documentId?: string
  action: AuditAction
  actorType: ActorType
  actorId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(entry: AuditLogEntry) {
  return db.auditLog.create({
    data: {
      businessId: entry.businessId,
      hireId: entry.hireId,
      documentId: entry.documentId,
      action: entry.action,
      actorType: entry.actorType,
      actorId: entry.actorId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      metadata: entry.metadata ? (entry.metadata as object) : undefined,
    },
  })
}

export function extractRequestInfo(request: Request) {
  return {
    ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  }
}
