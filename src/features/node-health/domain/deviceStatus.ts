/** Per-device online/offline shape rendered on the dashboard (CA-6). */
export interface DeviceStatus {
  deviceId: string
  name: string
  online: boolean
  lastSeen: string | null
}

/**
 * Structural shape of a `devices` row as read for node health. Declared here
 * instead of imported from `lib/database.types.ts` so domain keeps zero
 * imports outside `shared/lib` (D-1) -- same pattern as telemetry's
 * `LatestReadingRow`.
 */
export interface DeviceStatusRow {
  id: string
  name: string
  status: boolean
  last_seen: string | null
}

/** Maps a `devices` row to the domain `DeviceStatus` shape. */
export function toDeviceStatus(row: DeviceStatusRow): DeviceStatus {
  return {
    deviceId: row.id,
    name: row.name,
    online: row.status,
    lastSeen: row.last_seen,
  }
}
