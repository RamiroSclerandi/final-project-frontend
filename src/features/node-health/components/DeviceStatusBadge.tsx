import type { DeviceStatus } from '../domain/deviceStatus'

export interface DeviceStatusBadgeProps {
  device: DeviceStatus
}

/** One node's online/offline indicator (D-7): never hidden, always visible. */
export function DeviceStatusBadge({ device }: DeviceStatusBadgeProps) {
  return (
    <p
      role="status"
      className={
        device.online ? 'text-sm text-emerald-400' : 'text-sm text-slate-500'
      }
    >
      {device.name} —{' '}
      {device.online
        ? 'Online'
        : `Offline since ${device.lastSeen ?? 'unknown'}`}
    </p>
  )
}
