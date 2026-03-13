"use client"

import { useRef, useState } from "react"
import type { FormDefinition, FormField } from "@/lib/forms/types"
import { FormFieldComponent } from "./form-field"

type FormRendererProps = {
  definition: FormDefinition
  initialValues?: Record<string, string>
  onSubmit: (data: Record<string, string>) => void
  onCancel: () => void
  submitLabel?: string
}

function validateField(field: FormField, value: string): string | undefined {
  const v = field.type === "checkbox" ? value : value.trim()

  if (field.required) {
    if (field.type === "checkbox" && v !== "true") {
      return `${field.label} is required`
    }
    if (field.type !== "checkbox" && !v) {
      return `${field.label} is required`
    }
  }

  if (!v) return undefined

  if (field.validation?.minLength && v.length < field.validation.minLength) {
    return (
      field.validation.message ||
      `Minimum ${field.validation.minLength} characters required`
    )
  }

  if (field.validation?.maxLength && v.length > field.validation.maxLength) {
    return (
      field.validation.message ||
      `Maximum ${field.validation.maxLength} characters allowed`
    )
  }

  if (field.validation?.pattern) {
    const re = new RegExp(field.validation.pattern)
    if (!re.test(v)) {
      return field.validation.message || `Invalid format`
    }
  }

  // SSN: need 9 raw digits
  if (field.type === "ssn" && v.replace(/\D/g, "").length !== 9) {
    return "Please enter a complete 9-digit SSN"
  }

  // Phone: need 10 raw digits
  if (field.type === "phone" && v.replace(/\D/g, "").length !== 10) {
    return "Please enter a complete 10-digit phone number"
  }

  // Routing: 9 digits + ABA checksum
  if (field.type === "routing") {
    if (v.length !== 9 || !/^\d{9}$/.test(v)) {
      return "Routing number must be exactly 9 digits"
    }
    const d = v.split("").map(Number)
    const sum =
      3 * (d[0] + d[3] + d[6]) +
      7 * (d[1] + d[4] + d[7]) +
      1 * (d[2] + d[5] + d[8])
    if (sum % 10 !== 0) {
      return "Invalid routing number (ABA checksum failed)"
    }
  }

  return undefined
}

export function FormRenderer({
  definition,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Continue to Signature",
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    for (const field of definition.fields) {
      defaults[field.name] = initialValues[field.name] ?? (field.type === "checkbox" ? "false" : "")
    }
    return defaults
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({})

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleBlur(field: FormField) {
    const err = validateField(field, values[field.name] ?? "")
    setErrors((prev) => {
      if (!err) {
        const next = { ...prev }
        delete next[field.name]
        return next
      }
      return { ...prev, [field.name]: err }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    for (const field of definition.fields) {
      const err = validateField(field, values[field.name] ?? "")
      if (err) newErrors[field.name] = err
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorName = definition.fields.find((f) => newErrors[f.name])?.name
      if (firstErrorName && fieldRefs.current[firstErrorName]) {
        fieldRefs.current[firstErrorName]?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    onSubmit(values)
  }

  // Group fields by section
  const sections = definition.sections.length > 0 ? definition.sections : [{ id: "__default__", title: "" }]

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-8">
        {sections.map((section) => {
          const sectionFields = definition.fields.filter((f) =>
            definition.sections.length > 0
              ? f.section === section.id
              : true
          )

          if (sectionFields.length === 0) return null

          return (
            <div key={section.id} className="space-y-4">
              {section.title && (
                <h3 className="text-base font-semibold border-b pb-2">{section.title}</h3>
              )}
              <div className="space-y-4">
                {sectionFields.map((field) => (
                  <div
                    key={field.name}
                    ref={(el) => {
                      fieldRefs.current[field.name] = el
                    }}
                    onBlur={() => handleBlur(field)}
                  >
                    <FormFieldComponent
                      field={field}
                      value={values[field.name] ?? ""}
                      onChange={(val) => handleChange(field.name, val)}
                      error={errors[field.name]}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-md border border-input bg-background text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="h-9 px-4 rounded-md text-sm font-medium shadow-sm text-white transition-colors"
          style={{ backgroundColor: "#136334" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0f4f28")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#136334")}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
