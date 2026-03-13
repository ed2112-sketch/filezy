import { NextRequest, NextResponse } from "next/server"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadFile } from "@/lib/storage"
import { UserRole } from "@/lib/generated/prisma/client"

const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/svg+xml"]

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
})

const BUCKET = process.env.STORAGE_BUCKET_NAME!

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg"
    case "image/png":
      return ".png"
    case "image/svg+xml":
      return ".svg"
    default:
      return ""
  }
}

async function getBusinessForUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { ownedBusiness: true, business: true },
  })
  const business = user?.ownedBusiness ?? user?.business
  return { user, business }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { user, business } = await getBusinessForUser(session.user.id)

  if (!business || !user) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPG, PNG, and SVG are allowed." },
      { status: 415 }
    )
  }

  if (file.size > MAX_LOGO_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 2MB." },
      { status: 413 }
    )
  }

  const ext = getExtension(file.type)
  const key = `brands/${business.id}/logo${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  await uploadFile(key, buffer, file.type)

  const endpoint = process.env.STORAGE_ENDPOINT ?? ""
  const publicUrl = `${endpoint}/${BUCKET}/${key}`

  await db.business.update({
    where: { id: business.id },
    data: { brandLogoUrl: publicUrl },
  })

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { user, business } = await getBusinessForUser(session.user.id)

  if (!business || !user) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  if (user.role !== UserRole.OWNER && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Optionally delete from S3 — attempt all known extensions
  const extensions = [".jpg", ".png", ".svg"]
  await Promise.allSettled(
    extensions.map((ext) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: `brands/${business.id}/logo${ext}`,
        })
      )
    )
  )

  await db.business.update({
    where: { id: business.id },
    data: { brandLogoUrl: null },
  })

  return NextResponse.json({ success: true })
}
