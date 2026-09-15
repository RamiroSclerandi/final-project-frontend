import { supabase } from '../../../shared/api/supabase'
import { toAggregatePoint, toRawPoint } from '../domain/historicalPoint'
import type {
  AggregateBucketRow,
  HistoricalPoint,
  RawMeasurementRow,
} from '../domain/historicalPoint'

// PostgREST's default page size (.supabase-backend/supabase/config.toml,
// max_rows = 1000). A 24h raw window at 15s sampling is ~5,760 rows, well
// past one page, so a single request would silently drop the rest.
const RAW_PAGE_SIZE = 1000

/** Raw `measurements` for a range, paginated past PostgREST's row cap (D-3). */
export async function fetchRawMeasurements(
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<HistoricalPoint[]> {
  const rows: RawMeasurementRow[] = []
  for (let offset = 0; ; offset += RAW_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('sensor_id', sensorId)
      .gte('timestamp', fromIso)
      .lte('timestamp', toIso)
      .order('timestamp', { ascending: true })
      .range(offset, offset + RAW_PAGE_SIZE - 1)
    if (error) {
      throw error
    }
    rows.push(...data)
    if (data.length < RAW_PAGE_SIZE) {
      break
    }
  }
  return rows.map(toRawPoint)
}

async function fetchAggregate(
  table: 'mv_measurements_hourly' | 'mv_measurements_daily',
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<HistoricalPoint[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('sensor_id', sensorId)
    .gte('bucket', fromIso)
    .lte('bucket', toIso)
    .order('bucket', { ascending: true })
  if (error) {
    throw error
  }
  return data.filter(hasCompleteBucket).map(toAggregatePoint)
}

/**
 * `mv_measurements_hourly`/`_daily` group by non-null columns, so every
 * field is non-null in practice -- Postgres cannot prove that through a
 * matview, so PostgREST types every column nullable. Drop any row missing a
 * field the domain requires rather than pass an unproven null through.
 */
function hasCompleteBucket<
  T extends {
    bucket: string | null
    avg_value: number | null
    min_value: number | null
    max_value: number | null
    sample_count: number | null
  },
>(row: T): row is T & AggregateBucketRow {
  return (
    row.bucket !== null &&
    row.avg_value !== null &&
    row.min_value !== null &&
    row.max_value !== null &&
    row.sample_count !== null
  )
}

/** Hourly-bucketed aggregate for a range (REQ-HS-5/6, D-3). */
export function fetchHourlyAggregate(
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<HistoricalPoint[]> {
  return fetchAggregate('mv_measurements_hourly', sensorId, fromIso, toIso)
}

/** Daily-bucketed aggregate for a range (REQ-HS-5/6, D-3). */
export function fetchDailyAggregate(
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<HistoricalPoint[]> {
  return fetchAggregate('mv_measurements_daily', sensorId, fromIso, toIso)
}

/**
 * The single newest raw reading for a sensor -- the daily tail-merge marker
 * (D-3), instead of a full day of raw rows for one point.
 */
export async function fetchLatestMeasurement(
  sensorId: string,
): Promise<HistoricalPoint | null> {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('sensor_id', sensorId)
    .order('timestamp', { ascending: false })
    .limit(1)
  if (error) {
    throw error
  }
  return data[0] ? toRawPoint(data[0]) : null
}
