import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

// Concrete path, not the feature barrel: the barrel also exports the sensor
// view, which would pull Recharts into the fleet bundle.
import { fetchRawMeasurements } from '../../telemetry-history/infrastructure/historyRepository'
import { fleetSparklineQueryKey } from '../domain/queryKeys'
import { toSparklineValues } from '../domain/toSparklineValues'

const SPARKLINE_WINDOW_MS = 60 * 60 * 1000
const SPARKLINE_STALE_MS = 60_000

function floorToMinute(epochMs: number): string {
  return new Date(Math.floor(epochMs / 60_000) * 60_000).toISOString()
}

/**
 * One `useQueries` batch for the visible nodes' headline sensors (D4): a
 * single query per node, never a `useHistoricalSeries` call inside a table
 * row. Keyed by the window's floored end minute so every row shares one
 * stable cache entry per minute instead of refetching on every render.
 *
 * `Date.now()` is impure and cannot be called directly during render
 * (react-hooks/purity, same constraint as `RelativeTime`), so a lazy
 * `useState` initializer seeds the window and an interval advances it every
 * minute. Without that interval the key would freeze at mount and a wall
 * display left open all day would keep showing the hour it started in, under
 * a column still labelled "Last 60 min".
 */
export function useFleetSparklines(
  sensorIds: string[],
): Record<string, number[] | undefined> {
  const [windowEndIso, setWindowEndIso] = useState(() =>
    floorToMinute(Date.now()),
  )

  useEffect(() => {
    const timer = setInterval(
      () => setWindowEndIso(floorToMinute(Date.now())),
      SPARKLINE_STALE_MS,
    )
    return () => clearInterval(timer)
  }, [])

  const windowStartIso = new Date(
    new Date(windowEndIso).getTime() - SPARKLINE_WINDOW_MS,
  ).toISOString()

  const results = useQueries({
    queries: sensorIds.map((sensorId) => ({
      queryKey: fleetSparklineQueryKey(sensorId, windowEndIso),
      queryFn: () =>
        fetchRawMeasurements(sensorId, windowStartIso, windowEndIso),
      staleTime: SPARKLINE_STALE_MS,
      select: toSparklineValues,
    })),
  })

  return useMemo(
    () =>
      sensorIds.reduce<Record<string, number[] | undefined>>(
        (acc, sensorId, index) => {
          acc[sensorId] = results[index]?.data
          return acc
        },
        {},
      ),
    [sensorIds, results],
  )
}
