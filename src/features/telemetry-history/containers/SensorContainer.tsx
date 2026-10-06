import { useMemo, useState } from 'react'

import { ExportButton, useCsvExport } from '../../data-export'
import { useLatestReadings } from '../../telemetry'
import { useHistoricalSeries } from '../application/useHistoricalSeries'
import { useLiveSeries } from '../application/useLiveSeries'
import { ChartLegend } from '../components/ChartLegend'
import { DegradedStateBanner } from '../components/DegradedStateBanner'
import { HistoricalChart } from '../components/HistoricalChart'
import { RangePicker } from '../components/RangePicker'
import { SensorHeader } from '../components/SensorHeader'
import type { GranularityChoice } from '../domain/chooseGranularity'
import type { SeriesWindow } from '../domain/liveSeries'

// F-12: the last hour is raw data, so a fresh capture draws without waiting on any matview refresh.
const DEFAULT_RANGE_MS = 60 * 60 * 1000

interface SelectedRange {
  from: Date
  to: Date
  /** Set for a preset, whose window keeps sliding to now (F-10). */
  rangeMs?: number
}

function defaultRange(): SelectedRange {
  const to = new Date()
  return {
    from: new Date(to.getTime() - DEFAULT_RANGE_MS),
    to,
    rangeMs: DEFAULT_RANGE_MS,
  }
}

export interface SensorContainerProps {
  deviceId: string
  sensorId: string
}

/**
 * Wires the breadcrumb header, the range/granularity pickers, the merged
 * historical series, and the chart (REQ-SENSOR-1..5, REQ-HS-8, renamed from
 * `HistoryContainer` -- ui-redesign PR-8).
 */
export function SensorContainer({ deviceId, sensorId }: SensorContainerProps) {
  const [range, setRange] = useState(defaultRange)
  const [granularityChoice, setGranularityChoice] =
    useState<GranularityChoice>('auto')
  const latestReadingsQuery = useLatestReadings()
  const reading = latestReadingsQuery.data?.[sensorId]
  const series = useHistoricalSeries(
    sensorId,
    range.from,
    range.to,
    granularityChoice,
  )
  const { isLoading, aggregationStale } = series
  const window = useMemo<SeriesWindow>(
    () =>
      range.rangeMs === undefined
        ? {
            kind: 'fixed',
            fromMs: range.from.getTime(),
            toMs: range.to.getTime(),
          }
        : { kind: 'relative', rangeMs: range.rangeMs },
    [range],
  )
  // A preset is re-anchored to now, so the reload covers the gap the live
  // series could not backfill; a fixed range reloads in place.
  function reloadBase() {
    if (range.rangeMs === undefined) {
      series.refetch()
      return
    }
    const to = new Date()
    setRange({
      from: new Date(to.getTime() - range.rangeMs),
      to,
      rangeMs: range.rangeMs,
    })
  }
  const { points } = useLiveSeries({
    sensorId,
    granularity: series.granularity,
    basePoints: series.points,
    isBaseReady: !series.isLoading && series.error === null,
    window,
    onBaseStale: reloadBase,
  })
  const { exportRange, isExporting, error: exportError } = useCsvExport()
  const newestPointPartial = points.at(-1)?.partial ?? false

  return (
    <section className="flex flex-col gap-4">
      <SensorHeader deviceId={deviceId} reading={reading} />
      <RangePicker
        from={range.from}
        to={range.to}
        onChange={setRange}
        granularity={granularityChoice}
        onGranularityChange={setGranularityChoice}
      />
      <ChartLegend />
      <ExportButton
        onExport={() =>
          exportRange(
            sensorId,
            range.from.toISOString(),
            range.to.toISOString(),
          )
        }
        isExporting={isExporting}
        error={exportError}
      />
      <DegradedStateBanner
        aggregationStale={aggregationStale}
        newestPointPartial={newestPointPartial}
      />
      <HistoricalChart
        points={points}
        isLoading={isLoading}
        unit={reading?.unit ?? ''}
      />
    </section>
  )
}
