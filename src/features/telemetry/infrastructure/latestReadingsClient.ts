import { supabase } from '../../../shared/api/supabase'
import { toLatestReading } from '../domain/toLatestReading'
import type { LatestReading } from '../domain/reading'

/** Initial read of the latest value per sensor (D-2), the dashboard's hottest query. */
export async function fetchLatestReadings(): Promise<LatestReading[]> {
  const { data, error } = await supabase.from('v_latest_readings').select('*')
  if (error) {
    throw error
  }
  return data.map(toLatestReading)
}
