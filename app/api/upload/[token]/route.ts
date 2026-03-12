import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { uploadFile, buildFilePath } from "@/lib/storage"
import { calculateCompletionPct } from "@/lib/documents"

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const hire = await db.hire.findUnique({
    where: { uploadToken: token },
    include: {
      business: { select: { name: true } },
      documents: { select: { docType: true, fileName: true, uploadedAt: true } },
    },
  })

  if (!hire) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  if (hire.tokenExpiresAt < new Date()) {
    return Response.json(
      {
        error: "expired",
        businessName: hire.business.name,
      },
      { status: 410 }
    )
  }

  return Response.json({
    employeeName: hire.employeeName,
    businessName: hire.business.name,
    position: hire.position,
    status: hire.status,
    completionPct: hire.completionPct,
    documents: hire.documents.map((d) => ({
      docType: d.docType,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt,
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const hire = await db.hire.findUnique({
    where: { uploadToken: token },
    include: {
      documents: { select: { docType: true } },
      business: { select: { name: true, accountantEmail: true } },
    },
  })

  if (!hire) {
    return Response.json({ error: "not_found" }, { status: 404 })
  }

  if (hire.tokenExpiresAt < new Date()) {
    return Response.json({ error: "expired" }, { status: 410 })
  }

  if (hire.status === "EXPIRED") {
    return Response.json({ error: "expired" }, { status: 410 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: "invalid_form_data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const docType = formData.get("docType") as string | null

  if (!file || !docType) {
    return Response.json(
      { error: "missing_file_or_docType" },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "file_too_large", maxSizeMB: 20 },
      { status: 413 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "invalid_file_type", allowed: ALLOWED_TYPES },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filePath = buildFilePath(hire.id, docType, file.name)

  await uploadFile(filePath, buffer, file.type)

  await db.document.create({
    data: {
      hireId: hire.id,
      docType,
      filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
  })

  const allDocs = await db.document.findMany({
    where: { hireId: hire.id },
    select: { docType: true },
  })

  const completionPct = calculateCompletionPct(allDocs.map((d) => d.docType))
  const isComplete = completionPct === 100

  await db.hire.update({
    where: { id: hire.id },
    data: {
      completionPct,
      status: isComplete ? "COMPLETE" : "IN_PROGRESS",
    },
  })

  return Response.json({
    success: true,
    completionPct,
    status: isComplete ? "COMPLETE" : "IN_PROGRESS",
  })
}
