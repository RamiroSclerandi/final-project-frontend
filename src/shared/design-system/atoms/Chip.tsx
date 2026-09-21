import type { ReactNode } from 'react'

export interface ChipProps {
  children: ReactNode
}

/** A small pill used to display a single fact (transport, tag, count). */
export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-1 text-sm text-text">
      {children}
    </span>
  )
}
