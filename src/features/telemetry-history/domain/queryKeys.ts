import type { Granularity } from './chooseGranularity'

/** Cache key for `useHistoricalSeries` -- sensor, range and granularity, so either one changing refetches. */
export function historicalSeriesQueryKey(
  sensorId: string,
  fromIso: string,
  toIso: string,
  granularity: Granularity,
) {
  return ['historicalSeries', sensorId, fromIso, toIso, granularity] as const
}
