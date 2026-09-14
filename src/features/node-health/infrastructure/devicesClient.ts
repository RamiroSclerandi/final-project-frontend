import { supabase } from '../../../shared/api/supabase'
import { toDeviceStatus } from '../domain/deviceStatus'
import type { DeviceStatus } from '../domain/deviceStatus'

/** Initial read of every device's online/offline status (CA-6). */
export async function fetchDeviceStatuses(): Promise<DeviceStatus[]> {
  const { data, error } = await supabase.from('devices').select('*')
  if (error) {
    throw error
  }
  return data.map(toDeviceStatus)
}
