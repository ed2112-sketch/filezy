"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, FileText, Loader2, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { DOCUMENT_TYPES } from "@/lib/documents"
type Template = {
  id: string
  name: string
  docTypes: string[]
  createdAt: Date
}

export default function TemplatesManager({
  initialTemplates,
}: {
  initialTemplates: Template[]
}) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setName("")
    setSelectedDocTypes([])
    setError(null)
    setModalOpen(true)
  }

  function openEdit(template: Template) {
    setEditingId(template.id)
    setName(template.name)
    setSelectedDocTypes(template.docTypes)
    setError(null)
    setModalOpen(true)
  }

  function toggleDocType(docTypeId: string) {
    setSelectedDocTypes((prev) =>
      prev.includes(docTypeId)
        ? prev.filter((d) => d !== docTypeId)
        : [...prev, docTypeId]
    )
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Template name is required.")
      return
    }
    if (selectedDocTypes.length === 0) {
      setError("Select at least one document type.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const isEditing = editingId !== null
      const url = isEditing
        ? `/api/role-templates/${editingId}`
        : "/api/role-templates"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), docTypes: selectedDocTypes }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong.")
        return
      }

      const data = await res.json()
      if (isEditing) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? data.template : t))
        )
        setSuccess("Template updated.")
      } else {
        setTemplates((prev) => [data.template, ...prev])
        setSuccess("Template created.")
      }

      setModalOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return

    setDeleting(id)
    setError(null)

    try {
      const res = await fetch(`/api/role-templates/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to delete template.")
        return
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id))
      setSuccess("Template deleted.")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const docTypeEntries = Object.entries(DOCUMENT_TYPES) as [
    string,
    { id: string; label: string; description: string },
  ][]

  return (
    <>
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {error && !modalOpen && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={openCreate}
        className="gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
      >
        <Plus className="h-4 w-4" />
        Add Template
      </Button>

      {templates.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No role templates yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="rounded-2xl border-0 shadow-sm"
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className="bg-[#136334]/10 text-[#136334]"
                    >
                      {template.docTypes.length} document
                      {template.docTypes.length !== 1 ? "s" : ""}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.docTypes
                        .slice(0, 3)
                        .map((dt) => {
                          const entry =
                            DOCUMENT_TYPES[
                              dt as keyof typeof DOCUMENT_TYPES
                            ]
                          return entry?.label ?? dt
                        })
                        .join(", ")}
                      {template.docTypes.length > 3 &&
                        ` +${template.docTypes.length - 3} more`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(template)}
                    className="rounded-xl"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(template.id)}
                    disabled={deleting === template.id}
                    className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deleting === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Template" : "New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the template name and required documents."
                : "Give your template a name and select the documents new hires will need to submit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Full-Time Employee"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Required Documents</Label>
              <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-input p-3">
                {docTypeEntries.map(([key, docType]) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocTypes.includes(key)}
                      onChange={() => toggleDocType(key)}
                      className="mt-0.5 h-4 w-4 rounded accent-[#136334]"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium">
                        {docType.label}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {docType.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedDocTypes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDocTypes.length} selected
                </p>
              )}
            </div>

            {error && modalOpen && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingId ? (
                "Update Template"
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
