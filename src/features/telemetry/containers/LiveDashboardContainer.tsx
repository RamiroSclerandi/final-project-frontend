import { useLatestReadings } from '../application/useLatestReadings'
import { useRealtimeReadings } from '../application/useRealtimeReadings'
import { LatestReadingsGrid } from '../components/LatestReadingsGrid'

/** Wires the initial PostgREST fetch and the realtime subscription to the grid. */
export function LiveDashboardContainer() {
  const { data, isPending } = useLatestReadings()
  const { status } = useRealtimeReadings()

  return (
    <LatestReadingsGrid
      readings={data ? Object.values(data) : []}
      connectionStatus={status}
      isLoading={isPending}
    />
  )
}
