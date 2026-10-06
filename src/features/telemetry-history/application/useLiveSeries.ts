import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'

import type { Granularity } from '../domain/chooseGranularity'
import type { HistoricalPoint } from '../domain/historicalPoint'
import type {
  LiveReading,
  LiveSeriesState,
  SeriesWindow,
} from '../domain/liveSeries'
import {
  applyReading,
  bucketStartMs,
  resyncFrom,
  seedLiveSeries,
  toLiveReading,
} from '../domain/liveSeries'
import { MAX_RAW_ROWS, RawRowLimitError } from '../domain/rawRowLimit'
import { fetchRawMeasurements } from '../infrastructure/historyRepository'
import {
  subscribeToSensorInserts,
  unsubscribeFromSensorInserts,
} from '../infrastructure/liveMeasurementsClient'

interface LiveSeriesOptions {
  sensorId: string
  /** The granularity the loaded series actually has (after any fallback). */
  granularity: Granularity
  basePoints: HistoricalPoint[]
  isBaseReady: boolean
  window: SeriesWindow
  /** The live series cannot reconcile a gap on its own; reload the base. */
  onBaseStale: () => void
}

interface SeededSeries {
  base: HistoricalPoint[]
  state: LiveSeriesState
}

function acceptsLiveReadings(window: SeriesWindow, nowMs: number): boolean {
  return window.kind === 'relative' || window.toMs > nowMs
}

function windowStartMs(window: SeriesWindow, nowMs: number): number {
  return window.kind === 'relative' ? nowMs - window.rangeMs : window.fromMs
}

/**
 * F-10: keeps a loaded series live from Realtime INSERTs of its sensor.
 * Readings queue while the series is being reconciled -- after each load
 * (bucketed series refetch the newest bucket's raw rows, to learn their ids)
 * and after a reconnect (the gap since the last point is backfilled) -- and
 * are replayed once it is, deduplicated by id. A gap too wide for the raw
 * row limit asks the caller for a fresh load instead.
 */
export function useLiveSeries({
  sensorId,
  granularity,
  basePoints,
  isBaseReady,
  window,
  onBaseStale,
}: LiveSeriesOptions): { points: readonly HistoricalPoint[] } {
  const baseState = useMemo(() => seedLiveSeries(basePoints), [basePoints])
  // Live changes on top of the current base; a new base discards them.
  const [overlay, setOverlay] = useState<SeededSeries | null>(null)
  const overlayRef = useRef<SeededSeries | null>(null)
  const queueRef = useRef<LiveReading[]>([])
  const isSyncingRef = useRef(true)
  // Bumped on every load and unmount, so a stale reconcile never lands.
  const generationRef = useRef(0)

  const currentState = useEffectEvent((): LiveSeriesState => {
    const latest = overlayRef.current
    return latest?.base === basePoints ? latest.state : baseState
  })

  const commit = useEffectEvent((state: LiveSeriesState) => {
    const next = { base: basePoints, state }
    overlayRef.current = next
    setOverlay(next)
  })

  const replayQueue = useEffectEvent(() => {
    isSyncingRef.current = false
    if (queueRef.current.length === 0) {
      return
    }
    const nowMs = Date.now()
    let state = currentState()
    for (const reading of queueRef.current) {
      state = applyReading(state, reading, granularity, window, nowMs)
    }
    queueRef.current = []
    commit(state)
  })

  const reconcileFrom = useEffectEvent(
    async (fromMs: number, onTooWide: 'reload' | 'keep') => {
      const generation = generationRef.current
      isSyncingRef.current = true
      try {
        const rawPoints = await fetchRawMeasurements(
          sensorId,
          new Date(fromMs).toISOString(),
          new Date().toISOString(),
          { maxRows: MAX_RAW_ROWS },
        )
        if (generation !== generationRef.current) {
          return
        }
        commit(resyncFrom(currentState(), fromMs, rawPoints, granularity))
      } catch (error) {
        if (generation !== generationRef.current) {
          return
        }
        if (error instanceof RawRowLimitError && onTooWide === 'reload') {
          onBaseStale()
        }
      }
      // A failed reconcile keeps the series as it is and stays live.
      replayQueue()
    },
  )

  const startLiveFromBase = useEffectEvent(() => {
    const newest = basePoints.at(-1)
    if (
      granularity === 'raw' ||
      !newest ||
      !acceptsLiveReadings(window, Date.now())
    ) {
      // Raw points already carry their ids: replay what queued during the load.
      replayQueue()
      return
    }
    // The newest bucket's readings carry no ids; refetch them raw so a live
    // reading already counted in it is not counted again.
    void reconcileFrom(bucketStartMs(Date.parse(newest.t), granularity), 'keep')
  })

  useEffect(() => {
    generationRef.current += 1
    isSyncingRef.current = true
    if (isBaseReady) {
      // Syncs with Realtime: replays readings that queued while loading (a
      // state update only when some did) and starts the async reconcile.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startLiveFromBase()
    }
    return () => {
      generationRef.current += 1
    }
  }, [basePoints, isBaseReady, granularity])

  const receive = useEffectEvent((reading: LiveReading) => {
    if (isSyncingRef.current) {
      queueRef.current.push(reading)
      return
    }
    commit(
      applyReading(currentState(), reading, granularity, window, Date.now()),
    )
  })

  const backfill = useEffectEvent(() => {
    if (isSyncingRef.current) {
      return
    }
    const last = currentState().points.at(-1)
    const nowMs = Date.now()
    const fromMs = last
      ? bucketStartMs(Date.parse(last.t), granularity)
      : windowStartMs(window, nowMs)
    void reconcileFrom(fromMs, 'reload')
  })

  useEffect(() => {
    if (!acceptsLiveReadings(window, Date.now())) {
      return
    }
    // Same lesson as H-4: a removed channel may still call back.
    let isCurrentChannel = true
    let hasBeenLive = false
    let hasDropped = false
    const channel = subscribeToSensorInserts(sensorId, {
      onInsert: (row) => {
        if (isCurrentChannel) {
          receive(toLiveReading(row))
        }
      },
      onStatusChange: (status) => {
        if (!isCurrentChannel) {
          return
        }
        if (status === 'down') {
          hasDropped = true
        } else if (status === 'live') {
          if (hasBeenLive && hasDropped) {
            backfill()
          }
          hasBeenLive = true
          hasDropped = false
        }
      },
    })
    return () => {
      isCurrentChannel = false
      if (channel) {
        unsubscribeFromSensorInserts(channel)
      }
    }
  }, [sensorId, window])

  const state = overlay?.base === basePoints ? overlay.state : baseState
  return { points: state.points }
}
