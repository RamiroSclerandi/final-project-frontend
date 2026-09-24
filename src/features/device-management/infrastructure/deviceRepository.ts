import { supabase } from '../../../shared/api/supabase'
import { toDevice } from '../domain/device'
import type { Device, DeviceRow } from '../domain/device'
import type { DeviceUpdate } from '../domain/deviceUpdate'
import type { SensorUpdate } from '../domain/sensorUpdate'

const DEVICE_COLUMNS =
  'id, mac_address, name, location_ref, transport, provisioned, firmware_version, owner_id, sensors(id, label, pin_connection, source, tag)'

/** Every device with its sensors, for inline management (CA-3). */
export async function fetchDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select(DEVICE_COLUMNS)
    .order('name', { ascending: true })
  if (error) {
    throw error
  }
  return (data as unknown as DeviceRow[]).map(toDevice)
}

/**
 * Sends ONLY the granted columns (REQ-DM-1/2, D-column-scoped grants):
 * `update` is always the allowlisted `DeviceUpdate` type, never a spread
 * form object, so `mac_address` cannot reach this call.
 */
export async function updateDevice(
  deviceId: string,
  update: DeviceUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('devices')
    .update(update)
    .eq('id', deviceId)
  if (error) {
    throw error
  }
}

/** Sends ONLY `label`/`pin_connection` (REQ-DM-3). */
export async function updateSensor(
  sensorId: string,
  update: SensorUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('sensors')
    .update(update)
    .eq('id', sensorId)
  if (error) {
    throw error
  }
}
