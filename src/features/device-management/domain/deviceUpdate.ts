import type { Device, Transport } from './device'

/**
 * Allowlisted UPDATE payload (REQ-DM-1/2, D-column-scoped grants): the ONLY
 * columns ever sent to `devices`. `mac_address` is structurally unreachable
 * through this type -- callers build this object field by field, never
 * spread a form/event object (REQ-DM-4).
 */
export interface DeviceUpdate {
  name?: string
  location_ref?: string | null
  transport?: Transport
  provisioned?: boolean
}

/** Applies an update to the targeted device only, leaving others untouched. */
export function applyDeviceUpdate(
  devices: Device[],
  deviceId: string,
  update: DeviceUpdate,
): Device[] {
  return devices.map((device) =>
    device.id === deviceId
      ? {
          ...device,
          ...(update.name !== undefined && { name: update.name }),
          ...(update.location_ref !== undefined && {
            locationRef: update.location_ref,
          }),
          ...(update.transport !== undefined && {
            transport: update.transport,
          }),
          ...(update.provisioned !== undefined && {
            provisioned: update.provisioned,
          }),
        }
      : device,
  )
}
