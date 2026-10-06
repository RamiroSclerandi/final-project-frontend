import type { ReactNode } from 'react'

export interface KpiStatProps {
  label: string
  value: ReactNode
  /** Decorative status glyph shown before the number. */
  indicator?: ReactNode
}

/** A compact inline stat (fleet/node counts): glyph, mono number, muted label. Purely presentational. */
export function KpiStat({ label, value, indicator }: KpiStatProps) {
  return (
    <div className="flex items-center gap-1.5">
      {indicator}
      <span className="font-mono text-sm font-medium tabular-nums text-text">
        {value}
      </span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}
