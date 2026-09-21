import { toPolylinePoints } from './toPolylinePoints'

export interface SparklineProps {
  values: number[]
  label: string
}

/**
 * A deterministic, dependency-free trend line (D4): inline SVG polyline
 * computed by the pure `toPolylinePoints`, no `ResizeObserver`/layout
 * measurement, so it renders identically in jsdom and the browser.
 */
export function Sparkline({ values, label }: SparklineProps) {
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="h-6 w-full"
    >
      <polyline
        points={toPolylinePoints(values)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
    </svg>
  )
}
