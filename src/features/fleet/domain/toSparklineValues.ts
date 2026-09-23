/**
 * Structural input for a sparkline series point (D-1: this domain imports
 * nothing outside `shared/lib`, so the shape is declared locally rather than
 * importing `telemetry-history`'s `HistoricalPoint` -- its `value` field
 * satisfies this structurally).
 */
export interface SparklinePointInput {
  value: number
}

/** Extracts plain numeric values for the `Sparkline` molecule (D4). */
export function toSparklineValues(points: SparklinePointInput[]): number[] {
  return points.map((point) => point.value)
}
