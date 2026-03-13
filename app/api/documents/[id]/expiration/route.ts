import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function resolveBusinessAndDocument(
  userId: string,
  documentId: string
) {
  const [user, document] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { ownedBusiness: true, business: true },
    }),
    db.document.findUnique({
      where: { id: documentId },
      include: { hire: true },
    }),
  ])

  const userBusiness = user?.ownedBusiness ?? user?.business
  if (!userBusiness) return { error: "No business", status: 403 }
  if (!document) return { error: "Document not found", status: 404 }
  if (document.hire.businessId !== userBusiness.id)
    return { error: "Forbidden", status: 403 }

  return { document, userBusiness }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const result = await resolveBusinessAndDocument(session.user.id, id)
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  let body: { expiresAt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.expiresAt) {
    return NextResponse.json(
      { error: "expiresAt is required" },
      { status: 400 }
    )
  }

  const expiresAt = new Date(body.expiresAt)
  if (isNaN(expiresAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format for expiresAt" },
      { status: 400 }
    )
  }

  // Check if an existing record has the same date to avoid resetting reminder timestamps on no-op saves
  const existing = await db.documentExpiration.findUnique({
    where: { documentId: id },
  })

  const dateChanged = !existing || existing.expiresAt.getTime() !== expiresAt.getTime()

  const expiration = await db.documentExpiration.upsert({
    where: { documentId: id },
    create: {
      documentId: id,
      expiresAt,
      isResolved: false,
    },
    update: {
      expiresAt,
      isResolved: false,
      ...(dateChanged && {
        reminder30SentAt: null,
        reminder7SentAt: null,
        expirationSentAt: null,
      }),
    },
  })

  return NextResponse.json({ success: true, expiration })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const result = await resolveBusinessAndDocument(session.user.id, id)
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  try {
    await db.documentExpiration.delete({
      where: { documentId: id },
    })
  } catch {
    // Record may not exist — treat as success
    return NextResponse.json({ success: true, deleted: false })
  }

  return NextResponse.json({ success: true, deleted: true })
}
