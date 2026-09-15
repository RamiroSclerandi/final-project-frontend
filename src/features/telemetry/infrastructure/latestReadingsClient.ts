import { supabase } from '../../../shared/api/supabase'
import { toLatestReading } from '../domain/toLatestReading'
import type { LatestReading, LatestReadingRow } from '../domain/reading'

/** Initial read of the latest value per sensor (D-2), the dashboard's hottest query. */
export async function fetchLatestReadings(): Promise<LatestReading[]> {
  const { data, error } = await supabase.from('v_latest_readings').select('*')
  if (error) {
    throw error
  }
  return data.filter(isCompleteReading).map(toLatestReading)
}

/**
 * `v_latest_readings` joins INNER, so every field is non-null in practice --
 * Postgres cannot prove that through a view, so PostgREST types every column
 * nullable. Drop any row missing a field the domain requires rather than
 * pass an unproven null through the type boundary.
 */
function isCompleteReading<
  T extends {
    sensor_id: string | null
    value: number | null
    timestamp: string | null
    quality: string | null
    channel: string | null
    unit: string | null
    device_name: string | null
  },
>(row: T): row is T & LatestReadingRow {
  return (
    row.sensor_id !== null &&
    row.value !== null &&
    row.timestamp !== null &&
    row.quality !== null &&
    row.channel !== null &&
    row.unit !== null &&
    row.device_name !== null
  )
}
