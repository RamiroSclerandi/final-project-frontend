import { useState } from 'react'

import { useHistoricalSeries } from '../application/useHistoricalSeries'
import { DegradedStateBanner } from '../components/DegradedStateBanner'
import { HistoricalChart } from '../components/HistoricalChart'
import { RangePicker } from '../components/RangePicker'

const DAY_MS = 24 * 60 * 60 * 1000

function defaultRange() {
  const to = new Date()
  return { from: new Date(to.getTime() - DAY_MS), to }
}

export interface HistoryContainerProps {
  sensorId: string
}

/** Wires the range picker, the merged historical series, and the chart. */
export function HistoryContainer({ sensorId }: HistoryContainerProps) {
  const [range, setRange] = useState(defaultRange)
  const { points, isLoading, aggregationStale } = useHistoricalSeries(
    sensorId,
    range.from,
    range.to,
  )
  const newestPointPartial = points.at(-1)?.partial ?? false

  return (
    <section className="flex flex-col gap-4">
      <RangePicker from={range.from} to={range.to} onChange={setRange} />
      <DegradedStateBanner
        aggregationStale={aggregationStale}
        newestPointPartial={newestPointPartial}
      />
      <HistoricalChart points={points} isLoading={isLoading} />
    </section>
  )
}
