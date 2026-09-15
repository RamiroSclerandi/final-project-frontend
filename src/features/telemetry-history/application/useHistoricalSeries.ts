import { useQuery } from '@tanstack/react-query'

import { chooseGranularity } from '../domain/chooseGranularity'
import type { Granularity } from '../domain/chooseGranularity'
import type { HistoricalPoint } from '../domain/historicalPoint'
import { historicalSeriesQueryKey } from '../domain/queryKeys'
import {
  fetchDailyAggregate,
  fetchHourlyAggregate,
  fetchRawMeasurements,
} from '../infrastructure/historyRepository'

type FetchSeries = (
  sensorId: string,
  fromIso: string,
  toIso: string,
) => Promise<HistoricalPoint[]>

const FETCH_BY_GRANULARITY: Record<Granularity, FetchSeries> = {
  raw: fetchRawMeasurements,
  hourly: fetchHourlyAggregate,
  daily: fetchDailyAggregate,
}

interface HistoricalSeriesResult {
  granularity: Granularity
  points: HistoricalPoint[]
  isLoading: boolean
  error: Error | null
  queryDurationMs: number | null
}

/**
 * Picks granularity from the requested range (REQ-HS-1, D-3) and runs the
 * matching query. `queryDurationMs` is the CA-2 measurement instrument
 * (D-8): wall time from dispatch to parsed response.
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
      const points = await FETCH_BY_GRANULARITY[granularity](
        sensorId,
        fromIso,
        toIso,
      )
      return { points, queryDurationMs: performance.now() - t0 }
    },
  })

  return {
    granularity,
    points: query.data?.points ?? [],
    isLoading: query.isLoading,
    error: query.error,
    queryDurationMs: query.data?.queryDurationMs ?? null,
  }
}
