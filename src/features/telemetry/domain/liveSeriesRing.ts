import type { RoutedMeasurement } from './routeMeasurement'

/** Ring cap per sensor (D-2), a design estimate pending measurement (open question). */
export const LIVE_SERIES_CAP = 2000

export interface LiveSeriesPoint {
  timestamp: string
  value: number
}

/** Appends a point to the routed sensor's series, dropping the oldest once over cap. */
export function appendLiveSeriesPoint(
  series: Record<string, LiveSeriesPoint[]>,
  update: RoutedMeasurement,
  cap: number = LIVE_SERIES_CAP,
): Record<string, LiveSeriesPoint[]> {
  const existing = series[update.sensorId] ?? []
  const next = [
    ...existing,
    { timestamp: update.timestamp, value: update.value },
  ]
  return {
    ...series,
    [update.sensorId]: next.length > cap ? next.slice(next.length - cap) : next,
  }
}
