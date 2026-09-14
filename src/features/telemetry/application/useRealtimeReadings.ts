import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { RealtimeStatus } from '../domain/connectionStatus'
import {
  appendLiveSeriesPoint,
  type LiveSeriesPoint,
} from '../domain/liveSeriesRing'
import { mergeLatestReading } from '../domain/mergeLatestReading'
import {
  LATEST_READINGS_QUERY_KEY,
  LIVE_SERIES_QUERY_KEY,
} from '../domain/queryKeys'
import type { LatestReading } from '../domain/reading'
import { routeMeasurement } from '../domain/routeMeasurement'
import {
  resolvePendingSensors,
  trackUnknownSensor,
} from '../domain/unknownSensorTracking'
import {
  subscribeToMeasurementInserts,
  unsubscribeFromMeasurements,
} from '../infrastructure/realtimeMeasurementsClient'

/**
 * Opens the single measurements-INSERT channel once per mount (D-2), routes
 * every row client-side into the latest-readings and live-series caches, and
 * exposes connection status. Never re-subscribes on re-render.
 */
export function useRealtimeReadings(): { status: RealtimeStatus } {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const everLiveRef = useRef(false)
  const pendingUnknownRef = useRef<ReadonlySet<string>>(new Set())

  useEffect(() => {
    const channel = subscribeToMeasurementInserts({
      onInsert: (row) => {
        const update = routeMeasurement(row)
        const known = new Set(
          Object.keys(
            queryClient.getQueryData<Record<string, LatestReading>>(
              LATEST_READINGS_QUERY_KEY,
            ) ?? {},
          ),
        )
        const tracked = trackUnknownSensor(
          known,
          pendingUnknownRef.current,
          update.sensorId,
        )
        pendingUnknownRef.current = tracked.pending
        if (tracked.shouldInvalidate) {
          void queryClient
            .invalidateQueries({ queryKey: LATEST_READINGS_QUERY_KEY })
            .then(() => {
              const refreshedKnown = new Set(
                Object.keys(
                  queryClient.getQueryData<Record<string, LatestReading>>(
                    LATEST_READINGS_QUERY_KEY,
                  ) ?? {},
                ),
              )
              pendingUnknownRef.current = resolvePendingSensors(
                pendingUnknownRef.current,
                refreshedKnown,
              )
            })
        }
        queryClient.setQueryData<Record<string, LatestReading>>(
          LATEST_READINGS_QUERY_KEY,
          (previous) => mergeLatestReading(previous ?? {}, update),
        )
        queryClient.setQueryData<Record<string, LiveSeriesPoint[]>>(
          LIVE_SERIES_QUERY_KEY,
          (previous) => appendLiveSeriesPoint(previous ?? {}, update),
        )
      },
      onStatusChange: (nextStatus) => {
        // Re-SUBSCRIBED after a real disconnect: repair only current values
        // (D-2 reconnect policy) -- the live-series gap is shown, not backfilled.
        if (nextStatus === 'live' && everLiveRef.current) {
          void queryClient.invalidateQueries({
            queryKey: LATEST_READINGS_QUERY_KEY,
          })
        }
        if (nextStatus === 'live') {
          everLiveRef.current = true
        }
        setStatus(nextStatus)
      },
    })

    return () => unsubscribeFromMeasurements(channel)
  }, [queryClient])

  return { status }
}
