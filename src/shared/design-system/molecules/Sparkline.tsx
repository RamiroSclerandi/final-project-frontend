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
  const points = toPolylinePoints(values)
  const lastY = parseLastY(points)

  return (
    <div className="relative h-6 w-full pr-0.5">
      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="h-6 w-full"
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {lastY === null ? null : (
        <span
          aria-hidden="true"
          className="absolute right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ top: `${(lastY / 24) * 100}%` }}
        />
      )}
    </div>
  )
}

/** Y of the final polyline point; the end dot is HTML so the stretched viewBox cannot squash it. */
function parseLastY(points: string): number | null {
  if (points === '') {
    return null
  }
  const y = Number(points.split(' ').at(-1)?.split(',')[1])
  return Number.isNaN(y) ? null : y
}
