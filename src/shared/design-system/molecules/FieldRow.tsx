import type { ReactNode } from 'react'

export interface FieldRowProps {
  label: string
  children: ReactNode
}

/** A labeled row pairing a field's already-translated label with its control. */
export function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  )
}
