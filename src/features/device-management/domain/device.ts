export type Transport = 'wifi-mqtt' | 'lorawan' | 'cellular'
export const TRANSPORTS: Transport[] = ['wifi-mqtt', 'lorawan', 'cellular']

export interface SensorSummary {
  id: string
  label: string | null
  pinConnection: string | null
  source: string
  tag: string
}

/** A device with its sensors, for inline management (CA-3). */
export interface Device {
  id: string
  macAddress: string
  name: string
  locationRef: string | null
  transport: Transport
  provisioned: boolean
  sensors: SensorSummary[]
}

/**
 * Structural row shapes, declared here instead of imported from
 * `lib/database.types.ts` so domain keeps zero imports outside `shared/lib`
 * (D-1) -- same pattern as node-health's `DeviceStatusRow`.
 */
export interface SensorRow {
  id: string
  label: string | null
  pin_connection: string | null
  source: string
  tag: string
}
export interface DeviceRow {
  id: string
  mac_address: string
  name: string
  location_ref: string | null
  transport: string
  provisioned: boolean
  sensors: SensorRow[]
}

export function toSensorSummary(row: SensorRow): SensorSummary {
  return {
    id: row.id,
    label: row.label,
    pinConnection: row.pin_connection,
    source: row.source,
    tag: row.tag,
  }
}

export function toDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    macAddress: row.mac_address,
    name: row.name,
    locationRef: row.location_ref,
    transport: row.transport as Transport,
    provisioned: row.provisioned,
    sensors: row.sensors.map(toSensorSummary),
  }
}
