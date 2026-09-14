import { useDeviceStatuses } from '../application/useDeviceStatuses'
import { useRealtimeDeviceStatuses } from '../application/useRealtimeDeviceStatuses'
import { DeviceStatusList } from '../components/DeviceStatusList'

/** Wires the initial devices fetch and realtime status updates (CA-6). */
export function NodeHealthContainer() {
  const { data } = useDeviceStatuses()
  useRealtimeDeviceStatuses()

  return <DeviceStatusList devices={data ? Object.values(data) : []} />
}
