import { useState } from 'react'

import { ExportButton, useCsvExport } from '../../data-export'
import { useLatestReadings } from '../../telemetry'
import { useHistoricalSeries } from '../application/useHistoricalSeries'
import { ChartLegend } from '../components/ChartLegend'
import { DegradedStateBanner } from '../components/DegradedStateBanner'
import { HistoricalChart } from '../components/HistoricalChart'
import { RangePicker } from '../components/RangePicker'
import { SensorHeader } from '../components/SensorHeader'
import type { GranularityChoice } from '../domain/chooseGranularity'

const DAY_MS = 24 * 60 * 60 * 1000

function defaultRange() {
  const to = new Date()
  return { from: new Date(to.getTime() - DAY_MS), to }
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
  const { points, isLoading, aggregationStale } = useHistoricalSeries(
    sensorId,
    range.from,
    range.to,
    granularityChoice,
  )
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
