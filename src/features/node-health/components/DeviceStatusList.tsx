import type { DeviceStatus } from '../domain/deviceStatus'
import { DeviceStatusBadge } from './DeviceStatusBadge'

export interface DeviceStatusListProps {
  devices: DeviceStatus[]
}

/** Per-device header row (CA-6): one badge per node, grouped above the readings grid. */
export function DeviceStatusList({ devices }: DeviceStatusListProps) {
  if (devices.length === 0) {
    return null
  }

  return (
    <section className="flex flex-wrap gap-3">
      {devices.map((device) => (
        <DeviceStatusBadge key={device.deviceId} device={device} />
      ))}
    </section>
  )
}
