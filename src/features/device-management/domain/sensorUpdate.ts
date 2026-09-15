import type { Device } from './device'

/** Allowlisted UPDATE payload (REQ-DM-3): the ONLY columns ever sent to `sensors`. */
export interface SensorUpdate {
  label?: string | null
  pin_connection?: string | null
}

/** Applies an update to the targeted sensor, nested inside its device. */
export function applySensorUpdate(
  devices: Device[],
  sensorId: string,
  update: SensorUpdate,
): Device[] {
  return devices.map((device) => ({
    ...device,
    sensors: device.sensors.map((sensor) =>
      sensor.id === sensorId
        ? {
            ...sensor,
            ...(update.label !== undefined && { label: update.label }),
            ...(update.pin_connection !== undefined && {
              pinConnection: update.pin_connection,
            }),
          }
        : sensor,
    ),
  }))
}
