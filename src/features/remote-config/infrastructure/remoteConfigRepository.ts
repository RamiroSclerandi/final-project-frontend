import { supabase } from '../../../shared/api/supabase'
import { toDeviceConfigSummary } from '../domain/deviceConfig'
import type {
  DeviceConfigSummary,
  DeviceConfigSummaryRow,
} from '../domain/deviceConfig'
import { SamplingIntervalRequestError } from '../domain/setIntervalError'

const DEVICE_CONFIG_COLUMNS =
  'id, name, device_configs(sampling_interval_ms, requested_at)'

/** Every device paired with its current requested config, if any. */
export async function fetchDeviceConfigSummaries(): Promise<
  DeviceConfigSummary[]
> {
  const { data, error } = await supabase
    .from('devices')
    .select(DEVICE_CONFIG_COLUMNS)
    .order('name', { ascending: true })
  if (error) {
    throw error
  }
  return (data as unknown as DeviceConfigSummaryRow[]).map(
    toDeviceConfigSummary,
  )
}

/**
 * Requests a new sampling interval via the `set-sampling-interval` Edge
 * Function (REQ-RC-1..8). supabase-js attaches the session JWT automatically;
 * this never builds an MQTT topic or payload itself -- the function owns that.
 */
export async function setSamplingInterval(
  deviceId: string,
  samplingIntervalMs: number,
): Promise<void> {
  const { error, response } = await supabase.functions.invoke(
    'set-sampling-interval',
    { body: { deviceId, samplingIntervalMs } },
  )
  if (error) {
    throw new SamplingIntervalRequestError(response?.status)
  }
}
