import { useLatestReadings } from '../../telemetry'
import { HistoryTitle } from '../components/HistoryTitle'

export interface HistoryTitleContainerProps {
  sensorId: string
}

/** Sources the page title from the already-fetched latest-readings cache. */
export function HistoryTitleContainer({
  sensorId,
}: HistoryTitleContainerProps) {
  const { data } = useLatestReadings()
  return <HistoryTitle reading={data?.[sensorId]} />
}
