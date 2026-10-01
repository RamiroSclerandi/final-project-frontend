import { useTranslation } from '../../i18n/useTranslation'
import { unitLabel } from '../../lib/unitLabel'

export interface ValueProps {
  value: number
  unit: string
}

/**
 * Locale-formatted numeric display (REQ-DT-4): renders with `tabular-nums`
 * so digits stay aligned in tables, and formats the number through the
 * active locale's `Intl.NumberFormat`. Not a translated-text atom -- it
 * never calls `t()`, only the numeral formatter from `useTranslation()`.
 */
export function Value({ value, unit }: ValueProps) {
  const { formatNumber } = useTranslation()
  const formatted = formatNumber(value)
  const label = unitLabel(unit)

  return (
    <span className="tabular-nums">
      {label ? `${formatted} ${label}` : formatted}
    </span>
  )
}
