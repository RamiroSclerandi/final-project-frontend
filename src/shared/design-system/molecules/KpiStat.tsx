import type { ReactNode } from 'react'

export interface KpiStatProps {
  label: string
  value: ReactNode
}

/** A single labeled metric card (fleet/node counts). Purely presentational. */
export function KpiStat({ label, value }: KpiStatProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-text">
        {value}
      </span>
    </div>
  )
}
