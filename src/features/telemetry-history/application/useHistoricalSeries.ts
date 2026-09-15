import { useQuery } from '@tanstack/react-query'

import { chooseGranularity } from '../domain/chooseGranularity'
import type { Granularity } from '../domain/chooseGranularity'
import { isAggregationStale } from '../domain/degradedState'
import type { HistoricalPoint } from '../domain/historicalPoint'
import { mergeDailyTail, mergeHourlyTail } from '../domain/mergeTail'
import { historicalSeriesQueryKey } from '../domain/queryKeys'
import {
  fetchDailyAggregate,
  fetchHourlyAggregate,
  fetchLatestMeasurement,
  fetchRawMeasurements,
} from '../infrastructure/historyRepository'

interface GranularSeries {
  points: HistoricalPoint[]
  aggregationStale: boolean
}

/** Runs the query for the picked granularity and merges the raw tail (D-3). */
async function fetchGranularSeries(
  granularity: Granularity,
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<GranularSeries> {
  if (granularity === 'raw') {
    const points = await fetchRawMeasurements(sensorId, fromIso, toIso)
    return { points, aggregationStale: false }
  }

  if (granularity === 'hourly') {
    const aggregatePoints = await fetchHourlyAggregate(sensorId, fromIso, toIso)
    const lastBucket = aggregatePoints.at(-1)?.t ?? null
    const rawTail = lastBucket
      ? await fetchRawMeasurements(sensorId, lastBucket, toIso)
      : []
    return {
      points: mergeHourlyTail(aggregatePoints, rawTail),
      aggregationStale: isAggregationStale(
        lastBucket,
        new Date(toIso),
        'hourly',
      ),
    }
  }

  const aggregatePoints = await fetchDailyAggregate(sensorId, fromIso, toIso)
  const lastBucket = aggregatePoints.at(-1)?.t ?? null
  const latestRaw = await fetchLatestMeasurement(sensorId)
  return {
    points: mergeDailyTail(aggregatePoints, latestRaw),
    aggregationStale: isAggregationStale(lastBucket, new Date(toIso), 'daily'),
  }
}

interface HistoricalSeriesResult {
  granularity: Granularity
  points: HistoricalPoint[]
  isLoading: boolean
  error: Error | null
  queryDurationMs: number | null
  aggregationStale: boolean
}

/**
 * Picks granularity from the requested range (REQ-HS-1, D-3) and runs the
 * matching query, merged with the raw tail. `queryDurationMs` is the CA-2
 * measurement instrument (D-8): wall time from dispatch to parsed response.
 */
export function useHistoricalSeries(
  sensorId: string,
  from: Date,
  to: Date,
): HistoricalSeriesResult {
  const granularity = chooseGranularity(to.getTime() - from.getTime())
  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  const query = useQuery({
    queryKey: historicalSeriesQueryKey(sensorId, fromIso, toIso, granularity),
    queryFn: async () => {
      const t0 = performance.now()
      const series = await fetchGranularSeries(
        granularity,
        sensorId,
        fromIso,
        toIso,
      )
      return { ...series, queryDurationMs: performance.now() - t0 }
    },
  })

  return {
    granularity,
    points: query.data?.points ?? [],
    isLoading: query.isLoading,
    error: query.error,
    queryDurationMs: query.data?.queryDurationMs ?? null,
    aggregationStale: query.data?.aggregationStale ?? false,
  }
}
