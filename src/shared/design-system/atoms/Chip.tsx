import type { ReactNode } from 'react'

export interface ChipProps {
  children: ReactNode
}

/** A small pill used to display a single fact (transport, tag, count). */
export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border bg-surface px-2 py-1 font-mono text-xs uppercase tracking-label text-text">
      {children}
    </span>
  )
}
