import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { REQUIRED_DOC_TYPES, DOCUMENT_TYPES, calculateCompletionPct } from "@/lib/documents"

/** Escape a single CSV field value: wrap in quotes and double any internal quotes. */
function csvField(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value)
  // Escape double-quotes by doubling them, then wrap the whole value in quotes
  return `"${str.replace(/"/g, '""')}"`
}

export async function GET() {
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

  // Fetch all hires for this business, including documents and location
  const hires = await db.hire.findMany({
    where: { businessId: userBusiness.id },
    orderBy: { createdAt: "desc" },
    include: {
      documents: true,
      location: true,
    },
  })

  // CSV header row
  const columns = [
    "Employee Name",
    "Email",
    "Position",
    "Status",
    "Start Date",
    "Completion %",
    "Missing Documents",
    "Location",
  ]

  const rows: string[] = [columns.map(csvField).join(",")]

  for (const hire of hires) {
    const uploadedDocTypes = new Set(hire.documents.map((d) => d.docType))

    const missingDocTypes = REQUIRED_DOC_TYPES.filter(
      (t) => !uploadedDocTypes.has(t)
    )
    const missingLabels = missingDocTypes
      .map((t) => DOCUMENT_TYPES[t as keyof typeof DOCUMENT_TYPES]?.label ?? t)
      .join("; ")

    const startDate = hire.startDate
      ? hire.startDate.toISOString().slice(0, 10)
      : ""

    const row = [
      csvField(hire.employeeName),
      csvField(hire.employeeEmail),
      csvField(hire.position),
      csvField(hire.status),
      csvField(startDate),
      csvField(calculateCompletionPct([...uploadedDocTypes])),
      csvField(missingLabels),
      csvField(hire.location?.name),
    ].join(",")

    rows.push(row)
  }

  const csv = rows.join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hires-export.csv"',
    },
  })
}
