import { useParams } from 'react-router-dom'

import { SensorContainer } from '../features/telemetry-history'

/**
 * Sensor detail route (`/nodes/:id/sensors/:sid`, ui-redesign PR-8),
 * replacing the coming-soon placeholder. Mounted as a child of the app
 * shell -- its own landmark is the shell's `<main>`, not this page's.
 */
export function SensorPage() {
  // Always present: the route is only matched as /nodes/:id/sensors/:sid.
  const { id, sid } = useParams<{ id: string; sid: string }>() as {
    id: string
    sid: string
  }

  return <SensorContainer deviceId={id} sensorId={sid} />
}
