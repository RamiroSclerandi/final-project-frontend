import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  toAggregatePoint,
  toRawPoint,
} from '../../src/features/telemetry-history/domain/historicalPoint'
import { mergeHourlyTail } from '../../src/features/telemetry-history/domain/mergeTail'

// Matview access (REQ-HS-5/6) and aggregate query latency (CA-2, REQ-HS-2),
// against the real local Supabase stack (D-6); nothing here is mocked. A
// matview cannot carry RLS, so GRANT/REVOKE -- applied by the backend's
// aggregation-schedule migration (D-9a) -- is the entire access-control
// surface, and this is its client-side proof. The refresh below runs
// through `supabase db query`, the same execFileSync pattern already used
// for `supabase status`: PostgREST has no endpoint for REFRESH MATERIALIZED
// VIEW, and the CLI already speaks real SQL without adding a new dependency.

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')

interface LocalSupabaseStatus {
  API_URL: string
  ANON_KEY: string
  SERVICE_ROLE_KEY: string
}

function readLocalSupabaseStatus(): LocalSupabaseStatus {
  const output = execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
  })
  return JSON.parse(output) as LocalSupabaseStatus
}

function refreshHourlyMatview(): void {
  execFileSync(
    'supabase',
    [
      'db',
      'query',
      'REFRESH MATERIALIZED VIEW mv_measurements_hourly',
      '--local',
    ],
    { cwd: BACKEND_DIR, encoding: 'utf8' },
  )
}

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const BUCKET_COUNT = 720 // 30 days x 24h (REQ-HS-2's seed)
const RAW_PAGE_SIZE = 1000
const RAW_ROW_COUNT = 1200

describe('historical-series: matview access and aggregate latency (REQ-HS-2, REQ-HS-5, REQ-HS-6)', () => {
  const status = readLocalSupabaseStatus()

  // No generic here, same reason as the other integration files:
  // database.types.ts is a placeholder that only declares the columns each
  // feature selects.
  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const anonClient = createClient(status.API_URL, status.ANON_KEY)
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `historical-series-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let createdSensorTypeId: string | null = null
  let createdSensorId: string | null = null
  let createdPaginationSensorId: string | null = null

  // Rounded to the hour so every seeded timestamp lands exactly on a
  // date_trunc('hour', ...) boundary -- otherwise the first bucket could
  // fall a few minutes before rangeStart and be excluded by the range filter.
  const rangeEnd = new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS)
  const rangeStart = new Date(rangeEnd.getTime() - BUCKET_COUNT * HOUR_MS)

  beforeAll(async () => {
    // Default hookTimeout (10s) is too short for seeding ~1,900 rows plus a
    // CLI-shelled matview refresh.
    const { data: userData, error: userError } =
      await serviceRoleClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      })
    if (userError || !userData.user) {
      throw new Error(`Failed to seed the test user: ${userError?.message}`)
    }
    createdUserId = userData.user.id

    const { error: signInError } =
      await authenticatedClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
    if (signInError) {
      throw new Error(`Failed to sign in the test user: ${signInError.message}`)
    }

    const { data: device, error: deviceError } = await serviceRoleClient
      .from('devices')
      .insert({
        mac_address: 'FF11EE22DD33',
        name: 'Historical series test device',
      })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { data: sensorType, error: sensorTypeError } = await serviceRoleClient
      .from('sensor_types')
      .insert({ name: 'historical-series-test', unit: 'unit' })
      .select('id')
      .single()
    if (sensorTypeError || !sensorType) {
      throw new Error(
        `Failed to seed a sensor type: ${sensorTypeError?.message}`,
      )
    }
    createdSensorTypeId = (sensorType as { id: string }).id

    const { data: sensor, error: sensorError } = await serviceRoleClient
      .from('sensors')
      .insert({
        device_id: createdDeviceId,
        type_id: createdSensorTypeId,
        source: 'historical-series-hourly-source',
      })
      .select('id')
      .single()
    if (sensorError || !sensor) {
      throw new Error(
        `Failed to seed the hourly sensor: ${sensorError?.message}`,
      )
    }
    createdSensorId = (sensor as { id: string }).id

    const { data: paginationSensor, error: paginationSensorError } =
      await serviceRoleClient
        .from('sensors')
        .insert({
          device_id: createdDeviceId,
          type_id: createdSensorTypeId,
          source: 'historical-series-pagination-source',
        })
        .select('id')
        .single()
    if (paginationSensorError || !paginationSensor) {
      throw new Error(
        `Failed to seed the pagination sensor: ${paginationSensorError?.message}`,
      )
    }
    createdPaginationSensorId = (paginationSensor as { id: string }).id

    // One 'ok' row per hour bucket over the range -- date_trunc('hour', ...)
    // groups exactly one row per bucket, so BUCKET_COUNT rows in produce
    // BUCKET_COUNT buckets out.
    const hourlyRows = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
      sensor_id: createdSensorId,
      value: 20 + (i % 5),
      timestamp: new Date(rangeStart.getTime() + i * HOUR_MS).toISOString(),
      quality: 'ok',
    }))
    const { error: hourlySeedError } = await serviceRoleClient
      .from('measurements')
      .insert(hourlyRows)
    if (hourlySeedError) {
      throw new Error(
        `Failed to seed hourly measurements: ${hourlySeedError.message}`,
      )
    }

    refreshHourlyMatview()

    // A dedicated sensor and range for the pagination proof, so it never
    // overlaps the 720-row hourly seed above.
    const paginationStart = new Date(
      rangeEnd.getTime() - RAW_ROW_COUNT * MINUTE_MS,
    )
    const paginationRows = Array.from({ length: RAW_ROW_COUNT }, (_, i) => ({
      sensor_id: createdPaginationSensorId,
      value: 15 + (i % 3),
      timestamp: new Date(
        paginationStart.getTime() + i * MINUTE_MS,
      ).toISOString(),
      quality: 'ok',
    }))
    const { error: paginationSeedError } = await serviceRoleClient
      .from('measurements')
      .insert(paginationRows)
    if (paginationSeedError) {
      throw new Error(
        `Failed to seed pagination measurements: ${paginationSeedError.message}`,
      )
    }
  }, 30_000)

  afterAll(async () => {
    // devices -> sensors -> measurements cascade on delete; sensor_types
    // does not, so it is removed explicitly once no sensor references it.
    if (createdDeviceId) {
      await serviceRoleClient.from('devices').delete().eq('id', createdDeviceId)
    }
    if (createdSensorTypeId) {
      await serviceRoleClient
        .from('sensor_types')
        .delete()
        .eq('id', createdSensorTypeId)
    }
    if (createdUserId) {
      await serviceRoleClient.auth.admin.deleteUser(createdUserId)
    }
  })

  it('lets an authenticated session read both matviews and refuses anonymous (REQ-HS-5, REQ-HS-6)', async () => {
    for (const view of [
      'mv_measurements_hourly',
      'mv_measurements_daily',
    ] as const) {
      const authenticated = await authenticatedClient
        .from(view)
        .select('sensor_id')
        .limit(1)
      expect(authenticated.error).toBeNull()

      const anon = await anonClient.from(view).select('sensor_id').limit(1)
      if (anon.error) {
        expect(anon.error).not.toBeNull()
      } else {
        expect(anon.data).toEqual([])
      }
    }
  })

  it('returns 720 hourly buckets for a 30-day range, timing captured for CA-2 (REQ-HS-2)', async () => {
    const t0 = performance.now()
    const { data, error } = await authenticatedClient
      .from('mv_measurements_hourly')
      .select('bucket,avg_value')
      .eq('sensor_id', createdSensorId as string)
      .gte('bucket', rangeStart.toISOString())
      .lte('bucket', rangeEnd.toISOString())
      .order('bucket', { ascending: true })
    const elapsedMs = performance.now() - t0

    expect(error).toBeNull()
    expect(data).toHaveLength(BUCKET_COUNT)
    // CA-2 must be reported honestly (D-8), not silently asserted away.
    console.info(
      `historical-series CA-2: ${BUCKET_COUNT} hourly buckets fetched in ${elapsedMs.toFixed(1)}ms`,
    )
    expect(elapsedMs).toBeLessThan(1000)
  })

  it('merges the raw tail into the hourly aggregate within the CA-2 budget (REQ-HS-2, REQ-HS-3, D-3)', async () => {
    // Simulates the still-forming newest bucket REQ-HS-3 must repair: a
    // fresh reading landing after the seeded range, before any refresh runs.
    const freshTimestamp = new Date(
      rangeEnd.getTime() + 5 * MINUTE_MS,
    ).toISOString()
    const { error: freshInsertError } = await serviceRoleClient
      .from('measurements')
      .insert({
        sensor_id: createdSensorId,
        value: 99,
        timestamp: freshTimestamp,
        quality: 'ok',
      })
    expect(freshInsertError).toBeNull()

    const t0 = performance.now()
    const { data: aggregateRows, error: aggregateError } =
      await authenticatedClient
        .from('mv_measurements_hourly')
        .select('*')
        .eq('sensor_id', createdSensorId as string)
        .gte('bucket', rangeStart.toISOString())
        .lte('bucket', rangeEnd.toISOString())
        .order('bucket', { ascending: true })
    expect(aggregateError).toBeNull()
    const aggregatePoints = (aggregateRows ?? []).map(toAggregatePoint)
    const lastBucket = aggregatePoints.at(-1)?.t ?? rangeStart.toISOString()

    const { data: rawRows, error: rawError } = await authenticatedClient
      .from('measurements')
      .select('*')
      .eq('sensor_id', createdSensorId as string)
      .gte('timestamp', lastBucket)
      .lte('timestamp', freshTimestamp)
      .order('timestamp', { ascending: true })
    expect(rawError).toBeNull()
    const rawTailPoints = (rawRows ?? []).map(toRawPoint)

    const merged = mergeHourlyTail(aggregatePoints, rawTailPoints)
    const elapsedMs = performance.now() - t0

    // CA-2 must be reported honestly (D-8), tail merge included this time.
    console.info(
      `historical-series CA-2 (with tail merge): resolved in ${elapsedMs.toFixed(1)}ms`,
    )
    expect(elapsedMs).toBeLessThan(1000)

    const newestPoint = merged.at(-1)
    expect(newestPoint?.partial).toBe(true)
    expect(newestPoint?.value).toBe(99)
  })

  it('pages past PostgREST default row cap without dropping rows (raw tail, D-3)', async () => {
    const paginationStart = new Date(
      rangeEnd.getTime() - RAW_ROW_COUNT * MINUTE_MS,
    )

    const unpaginated = await authenticatedClient
      .from('measurements')
      .select('timestamp')
      .eq('sensor_id', createdPaginationSensorId as string)
      .gte('timestamp', paginationStart.toISOString())
    // Proves the cap is real: RAW_ROW_COUNT (1200) rows exist, but an
    // unpaginated request truncates to PostgREST's max_rows.
    expect(unpaginated.data).toHaveLength(RAW_PAGE_SIZE)

    const pages = await Promise.all([
      authenticatedClient
        .from('measurements')
        .select('timestamp')
        .eq('sensor_id', createdPaginationSensorId as string)
        .gte('timestamp', paginationStart.toISOString())
        .order('timestamp', { ascending: true })
        .range(0, RAW_PAGE_SIZE - 1),
      authenticatedClient
        .from('measurements')
        .select('timestamp')
        .eq('sensor_id', createdPaginationSensorId as string)
        .gte('timestamp', paginationStart.toISOString())
        .order('timestamp', { ascending: true })
        .range(RAW_PAGE_SIZE, RAW_ROW_COUNT - 1),
    ])
    for (const page of pages) {
      expect(page.error).toBeNull()
    }
    // Same two-request .range() technique as historyRepository.ts's
    // fetchRawMeasurements loop -- proves it recovers the full set.
    const merged = pages.flatMap((page) => page.data ?? [])
    expect(merged).toHaveLength(RAW_ROW_COUNT)
  })

  it('pages the per-minute series function past the PostgREST row cap (F-13)', async () => {
    const paginationStart = new Date(
      rangeEnd.getTime() - RAW_ROW_COUNT * MINUTE_MS,
    )
    const seriesPage = (from: number, to: number) =>
      authenticatedClient
        .rpc('get_sensor_series', {
          p_sensor_id: createdPaginationSensorId as string,
          p_from: paginationStart.toISOString(),
          p_to: rangeEnd.toISOString(),
          p_bucket: 'minute',
        })
        .range(from, to)

    // Same paging as historyRepository.ts's fetchSensorSeries.
    const pages = await Promise.all([
      seriesPage(0, RAW_PAGE_SIZE - 1),
      seriesPage(RAW_PAGE_SIZE, 2 * RAW_PAGE_SIZE - 1),
    ])
    for (const page of pages) {
      expect(page.error).toBeNull()
    }
    const buckets = pages
      .flatMap((page) => page.data ?? [])
      .map(toAggregatePoint)

    // One seeded row per minute in a half-open range: one bucket each.
    expect(buckets).toHaveLength(RAW_ROW_COUNT)
    expect(buckets.every((bucket) => bucket.sampleCount === 1)).toBe(true)
    expect(Date.parse(buckets[0]?.t ?? '')).toBe(paginationStart.getTime())
  })

  it('refuses the series function to anonymous callers (F-13)', async () => {
    const { data, error } = await anonClient.rpc('get_sensor_series', {
      p_sensor_id: createdPaginationSensorId as string,
      p_from: rangeStart.toISOString(),
      p_to: rangeEnd.toISOString(),
      p_bucket: 'hour',
    })

    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })
})
