import type { WorkflowType } from "@/lib/generated/prisma/client"

export type WorkflowLabels = {
  hire: string
  hires: string
  addHire: string
  employee: string
  position: string
  onboarding: string
}

const LABELS: Record<WorkflowType, WorkflowLabels> = {
  EMPLOYER: {
    hire: "New Hire",
    hires: "Hires",
    addHire: "Add New Hire",
    employee: "Employee",
    position: "Position",
    onboarding: "Onboarding",
  },
  ACCOUNTANT: {
    hire: "Client",
    hires: "Clients",
    addHire: "Add Client",
    employee: "Client Contact",
    position: "Service Type",
    onboarding: "Document Collection",
  },
  STAFFING_AGENCY: {
    hire: "Worker",
    hires: "Workers",
    addHire: "Add Worker",
    employee: "Worker",
    position: "Assignment",
    onboarding: "Onboarding",
  },
}

export function getWorkflowLabels(workflowType: WorkflowType): WorkflowLabels {
  return LABELS[workflowType]
}
