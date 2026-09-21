export type SignalBarsCount = 0 | 1 | 2 | 3 | 4

export interface SignalBarsProps {
  bars: SignalBarsCount
  label: string
}

const BAR_COUNT = 4

/**
 * Signal-strength indicator (D12). `bars === 0` is the "unknown" variant
 * (no recent reading, or a rejected `rssiToBars` fallback) -- it still
 * renders every bar, just unfilled, and always pairs with `label` so the
 * state is never conveyed by the glyph alone.
 */
export function SignalBars({ bars, label }: SignalBarsProps) {
  const isUnknown = bars === 0

  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="inline-flex items-end gap-0.5">
        {Array.from({ length: BAR_COUNT }, (_, index) => {
          const barNumber = index + 1
          const filled = !isUnknown && barNumber <= bars
          return (
            <span
              key={barNumber}
              className={`w-1 rounded-sm ${filled ? 'bg-accent' : 'bg-border'}`}
              style={{ height: `${barNumber * 3}px` }}
            />
          )
        })}
      </span>
      <span className={isUnknown ? 'text-text-muted' : undefined}>{label}</span>
    </span>
  )
}
