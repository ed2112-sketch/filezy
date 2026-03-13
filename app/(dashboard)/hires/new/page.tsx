import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getWorkflowLabels } from "@/lib/workflow-labels"
import NewHireForm from "./new-hire-form"

export default async function NewHirePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const business = await db.business.findUnique({
    where: { ownerId: session.user.id },
    select: { workflowType: true },
  })
  if (!business) redirect("/signup")

  const labels = getWorkflowLabels(business.workflowType)

  return <NewHireForm addHireLabel={labels.addHire} />
}
