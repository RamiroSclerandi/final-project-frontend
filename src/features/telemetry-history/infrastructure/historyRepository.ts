import { supabase } from '../../../shared/api/supabase'
import { toAggregatePoint, toRawPoint } from '../domain/historicalPoint'
import type {
  AggregateBucketRow,
  HistoricalPoint,
  RawMeasurementRow,
} from '../domain/historicalPoint'

import { RawRowLimitError } from '../domain/rawRowLimit'

// PostgREST's max_rows (.supabase-backend/supabase/config.toml): any larger
// response is silently cut, so every list query pages through `.range()`.
const PAGE_SIZE = 1000

interface PageResult<Row> {
  data: Row[] | null
  error: Error | null
}

async function fetchAllPages<Row>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<Row>>,
): Promise<Row[]> {
  const rows: Row[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1)
    if (error) {
      throw error
    }
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) {
      return rows
    }
  }
}

function rawRangeQuery(
  sensorId: string,
  fromIso: string,
  toIso: string,
  head = false,
) {
  return supabase
    .from('measurements')
    .select('*', head ? { count: 'exact', head: true } : undefined)
    .eq('sensor_id', sensorId)
    .gte('timestamp', fromIso)
    .lte('timestamp', toIso)
}

async function assertRawRowCount(
  sensorId: string,
  fromIso: string,
  toIso: string,
  maxRows: number,
): Promise<void> {
  const { count, error } = await rawRangeQuery(sensorId, fromIso, toIso, true)
  if (error) {
    throw error
  }
  if (count !== null && count > maxRows) {
    throw new RawRowLimitError(count, maxRows)
  }
}

/**
 * Raw `measurements` for a range, paged past PostgREST's row cap (D-3).
 * With `maxRows`, a larger range is refused with `RawRowLimitError` before
 * any row is downloaded.
 */
export async function fetchRawMeasurements(
  sensorId: string,
  fromIso: string,
  toIso: string,
  { maxRows }: { maxRows?: number } = {},
): Promise<HistoricalPoint[]> {
  if (maxRows !== undefined) {
    await assertRawRowCount(sensorId, fromIso, toIso, maxRows)
  }
  const rows = await fetchAllPages<RawMeasurementRow>((from, to) =>
    rawRangeQuery(sensorId, fromIso, toIso)
      .order('timestamp', { ascending: true })
      .range(from, to),
  )
  return rows.map(toRawPoint)
}

async function fetchAggregate(
  table: 'mv_measurements_hourly' | 'mv_measurements_daily',
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<HistoricalPoint[]> {
  const rows = await fetchAllPages((from, to) =>
    supabase
      .from(table)
      .select('*')
      .eq('sensor_id', sensorId)
      .gte('bucket', fromIso)
      .lte('bucket', toIso)
      .order('bucket', { ascending: true })
      .range(from, to),
  )
  return rows.filter(hasCompleteBucket).map(toAggregatePoint)
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
