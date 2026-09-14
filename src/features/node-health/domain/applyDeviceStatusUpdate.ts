import type { DeviceStatus, DeviceStatusRow } from './deviceStatus'
import { toDeviceStatus } from './deviceStatus'

/**
 * Applies a `devices` UPDATE payload (REQ-NH-1, D-7) to the cached status
 * for that device only -- the Last-Will-driven flip, without a refetch.
 */
export function applyDeviceStatusUpdate(
  statuses: Record<string, DeviceStatus>,
  row: DeviceStatusRow,
): Record<string, DeviceStatus> {
  return { ...statuses, [row.id]: toDeviceStatus(row) }
}
