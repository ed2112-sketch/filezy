import { NextRequest } from "next/server"
import archiver from "archiver"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkFeatureAccess } from "@/lib/plans"
import { getSignedDownloadUrl } from "@/lib/storage"
import { DOCUMENT_TYPES } from "@/lib/documents"
import type { Plan } from "@/lib/generated/prisma/client"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user's business (owner or team member)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBusiness: true, business: true },
  })
  const userBusiness = user?.ownedBusiness ?? user?.business
  if (!userBusiness) {
    return Response.json({ error: "No business" }, { status: 403 })
  }

  // Check plan limit for bulk download
  if (!checkFeatureAccess(userBusiness.plan as Plan, "bulkDownload")) {
    return Response.json({ error: "Upgrade required" }, { status: 403 })
  }

  const body = await request.json()
  const { hireIds } = body as { hireIds: string[] }

  if (!Array.isArray(hireIds) || hireIds.length === 0) {
    return Response.json({ error: "hireIds must be a non-empty array" }, { status: 400 })
  }

  // Fetch all requested hires, verifying they belong to this business
  const hires = await db.hire.findMany({
    where: {
      id: { in: hireIds },
      businessId: userBusiness.id,
    },
    include: {
      documents: {
        include: {
          currentVersion: true,
        },
      },
    },
  })

  if (hires.length === 0) {
    return Response.json({ error: "No accessible hires found" }, { status: 404 })
  }

  // Build the ZIP archive using a TransformStream so we can stream it in the response
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  const archive = archiver("zip", { zlib: { level: 6 } })

  archive.on("data", (chunk: Buffer) => {
    writer.write(chunk)
  })

  archive.on("end", () => {
    writer.close()
  })

  archive.on("error", (err: Error) => {
    writer.abort(err)
  })

  // Process each hire asynchronously — we kick this off but don't await it
  // so the Response can start streaming immediately
  ;(async () => {
    for (const hire of hires) {
      for (const doc of hire.documents) {
        const version = doc.currentVersion
        if (!version) continue

        // Determine label from DOCUMENT_TYPES, fallback to docType key
        const docTypeKey = doc.docType as keyof typeof DOCUMENT_TYPES
        const label =
          DOCUMENT_TYPES[docTypeKey]?.label ?? doc.docType

        // Extract extension from original fileName
        const lastDot = version.fileName.lastIndexOf(".")
        const ext = lastDot !== -1 ? version.fileName.slice(lastDot) : ""

        const archiveName = `${hire.employeeName}/${label}${ext}`

        try {
          // Get a short-lived signed URL and fetch the file content
          const signedUrl = await getSignedDownloadUrl(version.filePath, 60)
          const fileResponse = await fetch(signedUrl)
          if (!fileResponse.ok || !fileResponse.body) continue

          const arrayBuffer = await fileResponse.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          archive.append(buffer, { name: archiveName })
        } catch {
          // Skip files that fail to download; continue building the ZIP
          continue
        }
      }
    }

    await archive.finalize()
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="documents.zip"',
      "Transfer-Encoding": "chunked",
    },
  })
}
