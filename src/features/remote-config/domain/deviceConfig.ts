/** The current requested sampling interval for one device. No `applied_at` -- the firmware never reports it back. */
export interface DeviceConfig {
  samplingIntervalMs: number
  requestedAt: string
}

/** A device paired with its config, or `null` when none has been requested yet. */
export interface DeviceConfigSummary {
  deviceId: string
  deviceName: string
  config: DeviceConfig | null
}

/**
 * Structural row shape for `devices` left-joined with `device_configs`
 * (one-to-one on `device_configs.device_id`), declared here instead of
 * imported from `lib/database.types.ts` so domain keeps zero imports outside
 * `shared/lib` (D-1) -- same pattern as device-management's `DeviceRow`.
 */
export interface DeviceConfigSummaryRow {
  id: string
  name: string
  device_configs: {
    sampling_interval_ms: number
    requested_at: string
  } | null
}

export function toDeviceConfigSummary(
  row: DeviceConfigSummaryRow,
): DeviceConfigSummary {
  return {
    deviceId: row.id,
    deviceName: row.name,
    config: row.device_configs
      ? {
          samplingIntervalMs: row.device_configs.sampling_interval_ms,
          requestedAt: row.device_configs.requested_at,
        }
      : null,
  }
}
