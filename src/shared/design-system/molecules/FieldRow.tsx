import type { ReactNode } from 'react'

export interface FieldRowProps {
  label: string
  children: ReactNode
}

/** A labeled row pairing a field's already-translated label with its control. */
export function FieldRow({ label, children }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-4">
      <span className="text-sm text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  )
}
