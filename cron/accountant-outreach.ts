import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})
const db = new PrismaClient({ adapter })

async function runOutreach() {
  const now = new Date()

  // Find all outreach records due for their next email
  const due = await db.accountantOutreach.findMany({
    where: {
      status: "IN_PROGRESS",
      nextEmailAt: { lte: now },
      emailsSent: { lt: 3 },
    },
    include: { triggeredBy: true },
  })

  for (const record of due) {
    if (record.emailsSent === 1) {
      // Send Email 2: Earnings calculator (day 5)
      // TODO: Wire up resend.emails.send with AccountantOutreach2 template
      console.log(`Sending outreach email 2 to ${record.email}`)
      await db.accountantOutreach.update({
        where: { id: record.id },
        data: {
          emailsSent: 2,
          nextEmailAt: new Date(
            now.getTime() + 9 * 24 * 60 * 60 * 1000
          ), // +9 days (day 14 total)
        },
      })
    } else if (record.emailsSent === 2) {
      // Send Email 3: Last call (day 14)
      // TODO: Wire up resend.emails.send with AccountantOutreach3 template
      console.log(`Sending outreach email 3 to ${record.email}`)
      await db.accountantOutreach.update({
        where: { id: record.id },
        data: {
          emailsSent: 3,
          status: "EXHAUSTED",
        },
      })
    }
  }

  // Send reminder emails to employees who haven't finished after 3 days
  const staleHires = await db.hire.findMany({
    where: {
      status: "IN_PROGRESS",
      createdAt: {
        lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      completionPct: { lt: 100 },
    },
    include: { business: true },
  })

  for (const hire of staleHires) {
    if (hire.employeeEmail) {
      // TODO: Wire up EmployeeReminder email via Resend
      console.log(
        `Would send reminder to ${hire.employeeEmail} for ${hire.employeeName}`
      )
    }
  }

  console.log(
    `Outreach cron complete. Processed ${due.length} sequences, ${staleHires.length} reminders.`
  )
  process.exit(0)
}

runOutreach().catch((err) => {
  console.error("Outreach cron failed:", err)
  process.exit(1)
})
