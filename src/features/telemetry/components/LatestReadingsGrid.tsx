import type { RealtimeStatus } from '../domain/connectionStatus'
import type { LatestReading } from '../domain/reading'
import { ConnectionStatusBadge } from './ConnectionStatusBadge'
import { LatestReadingCard } from './LatestReadingCard'

export interface LatestReadingsGridProps {
  readings: LatestReading[]
  connectionStatus: RealtimeStatus
  isLoading: boolean
}

export function LatestReadingsGrid({
  readings,
  connectionStatus,
  isLoading,
}: LatestReadingsGridProps) {
  if (isLoading) {
    return <p className="text-slate-400">Loading readings…</p>
  }

  if (readings.length === 0) {
    return <p className="text-slate-400">No sensors reporting yet.</p>
  }

  return (
    <section className="flex flex-col gap-4">
      <ConnectionStatusBadge status={connectionStatus} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {readings.map((reading) => (
          <LatestReadingCard key={reading.sensorId} reading={reading} />
        ))}
      </div>
    </section>
  )
}
