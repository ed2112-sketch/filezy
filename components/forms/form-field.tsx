"use client"

import { useState } from "react"
import type { FormField } from "@/lib/forms/types"

type FormFieldProps = {
  field: FormField
  value: string
  onChange: (value: string) => void
  error?: string
}

const inputClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"

// ABA routing number checksum validation
function isValidRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false
  const d = routing.split("").map(Number)
  const sum =
    3 * (d[0] + d[3] + d[6]) +
    7 * (d[1] + d[4] + d[7]) +
    1 * (d[2] + d[5] + d[8])
  return sum % 10 === 0
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatSSN(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export function FormFieldComponent({ field, value, onChange, error }: FormFieldProps) {
  const [ssnMasked, setSsnMasked] = useState(true)

  const labelEl = (
    <label className="text-sm font-medium leading-none">
      {field.label}
      {field.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )

  let inputEl: React.ReactNode

  switch (field.type) {
    case "text":
    case "account":
      inputEl = (
        <input
          type="text"
          className={inputClass}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case "number":
      inputEl = (
        <input
          type="text"
          inputMode="numeric"
          className={inputClass}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.]/g, "")
            onChange(v)
          }}
        />
      )
      break

    case "select":
      inputEl = (
        <select
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
      break

    case "checkbox":
      return (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-input"
              checked={value === "true"}
              onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            />
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.helpText && (
            <p className="text-xs text-muted-foreground">{field.helpText}</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )

    case "date":
      inputEl = (
        <input
          type="date"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case "ssn": {
      // Store raw 9 digits, display masked after entry
      const rawDigits = value.replace(/\D/g, "")
      const masked =
        rawDigits.length === 9 && ssnMasked
          ? `***-**-${rawDigits.slice(5)}`
          : formatSSN(rawDigits)

      inputEl = (
        <div className="relative">
          <input
            type="text"
            className={inputClass}
            placeholder="XXX-XX-XXXX"
            value={masked}
            onFocus={() => setSsnMasked(false)}
            onBlur={() => setSsnMasked(true)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
              onChange(digits)
            }}
            maxLength={11}
          />
        </div>
      )
      break
    }

    case "phone":
      inputEl = (
        <input
          type="text"
          inputMode="tel"
          className={inputClass}
          placeholder="(XXX) XXX-XXXX"
          value={formatPhone(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
            onChange(digits)
          }}
          maxLength={14}
        />
      )
      break

    case "routing": {
      const isValid = value.length === 9 ? isValidRoutingNumber(value) : null
      inputEl = (
        <div>
          <input
            type="text"
            inputMode="numeric"
            className={`${inputClass} ${value.length === 9 && isValid === false ? "border-red-500" : ""}`}
            placeholder="9-digit ABA routing number"
            value={value}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
              onChange(digits)
            }}
            maxLength={9}
          />
          {value.length === 9 && isValid === false && (
            <p className="text-xs text-red-500 mt-0.5">Invalid routing number (ABA checksum failed)</p>
          )}
          {value.length === 9 && isValid === true && (
            <p className="text-xs text-green-600 mt-0.5">Valid routing number</p>
          )}
        </div>
      )
      break
    }

    default:
      inputEl = (
        <input
          type="text"
          className={inputClass}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }

  return (
    <div className="flex flex-col gap-1">
      {labelEl}
      {inputEl}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
