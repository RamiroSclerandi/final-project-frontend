import { useQuery } from '@tanstack/react-query'

import { chooseGranularity } from '../domain/chooseGranularity'
import type {
  Granularity,
  GranularityChoice,
} from '../domain/chooseGranularity'
import { isAggregationStale } from '../domain/degradedState'
import type { HistoricalPoint } from '../domain/historicalPoint'
import { mergeDailyTail, mergeHourlyTail } from '../domain/mergeTail'
import { MAX_RAW_ROWS, RawRowLimitError } from '../domain/rawRowLimit'
import { historicalSeriesQueryKey } from '../domain/queryKeys'
import {
  fetchDailyAggregate,
  fetchHourlyAggregate,
  fetchLatestMeasurement,
  fetchRawMeasurements,
} from '../infrastructure/historyRepository'

interface GranularSeries {
  granularity: Granularity
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
    const points = await fetchRawMeasurements(sensorId, fromIso, toIso, {
      maxRows: MAX_RAW_ROWS,
    })
    return { granularity, points, aggregationStale: false }
  }

  if (granularity === 'hourly') {
    const [aggregatePoints, latestRaw] = await Promise.all([
      fetchHourlyAggregate(sensorId, fromIso, toIso),
      fetchLatestMeasurement(sensorId),
    ])
    const lastBucket = aggregatePoints.at(-1)?.t ?? null
    const rawTail = lastBucket
      ? await fetchRawMeasurements(sensorId, lastBucket, toIso)
      : []
    return {
      granularity,
      points: mergeHourlyTail(aggregatePoints, rawTail),
      aggregationStale: isAggregationStale(
        lastBucket,
        latestRaw?.t ?? null,
        'hourly',
      ),
    }
  }

  const [aggregatePoints, latestRaw] = await Promise.all([
    fetchDailyAggregate(sensorId, fromIso, toIso),
    fetchLatestMeasurement(sensorId),
  ])
  const lastBucket = aggregatePoints.at(-1)?.t ?? null
  return {
    granularity,
    points: mergeDailyTail(aggregatePoints, latestRaw),
    aggregationStale: isAggregationStale(
      lastBucket,
      latestRaw?.t ?? null,
      'daily',
    ),
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
 * matching query, merged with the raw tail. `granularityChoice` is an
 * optional override (REQ-HS-8, D2): any value other than the default
 * `'auto'` bypasses `chooseGranularity` entirely. `queryDurationMs` is the
 * CA-2 measurement instrument (D-8): wall time from dispatch to parsed
 * response.
 */
export function useHistoricalSeries(
  sensorId: string,
  from: Date,
  to: Date,
  granularityChoice: GranularityChoice = 'auto',
): HistoricalSeriesResult {
  const granularity =
    granularityChoice === 'auto'
      ? chooseGranularity(to.getTime() - from.getTime())
      : granularityChoice
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
      ).catch((error: unknown) => {
        // Auto picked raw from the range alone; a fast sampling interval can
        // still exceed the row limit, so degrade to hourly instead of failing.
        if (granularityChoice === 'auto' && error instanceof RawRowLimitError) {
          return fetchGranularSeries('hourly', sensorId, fromIso, toIso)
        }
        throw error
      })
      return { ...series, queryDurationMs: performance.now() - t0 }
    },
  })

  return {
    granularity: query.data?.granularity ?? granularity,
    points: query.data?.points ?? [],
    isLoading: query.isLoading,
    error: query.error,
    queryDurationMs: query.data?.queryDurationMs ?? null,
    aggregationStale: query.data?.aggregationStale ?? false,
  }
}
