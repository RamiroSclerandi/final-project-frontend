/**
 * Structural input type (D-1: this domain imports nothing outside
 * `shared/lib`, so `device-management`'s `Device` satisfies this shape
 * structurally instead of being imported here). Generic so the filter
 * preserves the caller's full row type instead of narrowing it to just
 * `ownerId`.
 */
export interface OwnableDevice {
  ownerId: string | null
}

/**
 * Keeps only devices with no assigned owner (REQ-ADMIN-1).
 *
 * Matches `undefined` as well as `null`: `fetchDevices` casts the PostgREST
 * payload rather than validating it, so a column the query stops returning
 * arrives absent instead of null. A strict `=== null` would then classify
 * every device as owned and tell the operator every device is assigned --
 * a false all-clear is a worse failure than an over-long list.
 */
export function filterUnassignedDevices<T extends OwnableDevice>(
  devices: T[],
): T[] {
  return devices.filter((device) => device.ownerId == null)
}
