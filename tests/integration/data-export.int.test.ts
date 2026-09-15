import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { toExportCsv } from '../../src/features/data-export/domain/exportCsv'
import type { ExportPoint } from '../../src/features/data-export/domain/exportCsv'

// CSV export end to end (REQ-DE-1, REQ-DE-2), against the real local Supabase
// stack (D-6); nothing here is mocked. Uses an ad-hoc client built from
// `supabase status`, same as every other integration file -- the production
// `supabase` singleton reads `VITE_SUPABASE_URL` from `.env`, which targets
// interactive dev, not this ephemeral local stack. `fetchPaginatedRaw` below
// mirrors `historyRepository.ts`'s `fetchRawMeasurements` loop exactly (same
// page size, same `.range()` pagination, already proven against the row cap
// in historical-aggregates.int.test.ts); this file's own job is proving the
// export CSV built from that data never truncates either.

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')
const RAW_PAGE_SIZE = 1000

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

async function fetchPaginatedRaw(
  client: SupabaseClient,
  sensorId: string,
  fromIso: string,
  toIso: string,
): Promise<ExportPoint[]> {
  const points: ExportPoint[] = []
  for (let offset = 0; ; offset += RAW_PAGE_SIZE) {
    const { data, error } = await client
      .from('measurements')
      .select('timestamp,value,quality,ts_source')
      .eq('sensor_id', sensorId)
      .gte('timestamp', fromIso)
      .lte('timestamp', toIso)
      .order('timestamp', { ascending: true })
      .range(offset, offset + RAW_PAGE_SIZE - 1)
    if (error) {
      throw error
    }
    const rows = data as { timestamp: string; value: number }[]
    points.push(...rows.map((row) => ({ t: row.timestamp, value: row.value })))
    if (rows.length < RAW_PAGE_SIZE) {
      break
    }
  }
  return points
}

describe('data-export: raw range export (REQ-DE-1, REQ-DE-2)', () => {
  const status = readLocalSupabaseStatus()

  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `data-export-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let createdSensorTypeId: string | null = null
  let createdSensorId: string | null = null

  const rangeEnd = new Date()
  const MINUTE_MS = 60 * 1000
  const ROW_COUNT = 1200 // exceeds PostgREST's 1000-row page (REQ-DE-2)
  const rangeStart = new Date(rangeEnd.getTime() - ROW_COUNT * MINUTE_MS)

  beforeAll(async () => {
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
      .insert({ mac_address: 'AA11BB22CC33', name: 'Export test device' })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { data: sensorType, error: sensorTypeError } = await serviceRoleClient
      .from('sensor_types')
      .insert({ name: 'data-export-test', unit: 'unit' })
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
        source: 'data-export-source',
      })
      .select('id')
      .single()
    if (sensorError || !sensor) {
      throw new Error(`Failed to seed a sensor: ${sensorError?.message}`)
    }
    createdSensorId = (sensor as { id: string }).id

    const rows = Array.from({ length: ROW_COUNT }, (_, i) => ({
      sensor_id: createdSensorId,
      value: 10 + (i % 4),
      timestamp: new Date(rangeStart.getTime() + i * MINUTE_MS).toISOString(),
      quality: 'ok',
    }))
    const { error: seedError } = await serviceRoleClient
      .from('measurements')
      .insert(rows)
    if (seedError) {
      throw new Error(`Failed to seed measurements: ${seedError.message}`)
    }
  }, 30_000)

  afterAll(async () => {
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

  it('exports exactly the seeded row count, matching the queried series (REQ-DE-1)', async () => {
    const smallRangeEnd = new Date(rangeStart.getTime() + 10 * MINUTE_MS)
    const points = await fetchPaginatedRaw(
      authenticatedClient,
      createdSensorId as string,
      rangeStart.toISOString(),
      smallRangeEnd.toISOString(),
    )

    const csv = toExportCsv(createdSensorId as string, points)
    const dataLines = csv.split('\r\n').slice(1)

    expect(dataLines).toHaveLength(points.length)
    expect(points.length).toBeGreaterThan(0)
    expect(dataLines[0]).toContain(String(points[0]?.value))
  })

  it('pages past the PostgREST row cap without dropping rows (REQ-DE-2)', async () => {
    const points = await fetchPaginatedRaw(
      authenticatedClient,
      createdSensorId as string,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
    )

    expect(points.length).toBeGreaterThan(RAW_PAGE_SIZE)
    expect(points).toHaveLength(ROW_COUNT)

    const csv = toExportCsv(createdSensorId as string, points)
    const dataLines = csv.split('\r\n').slice(1)
    expect(dataLines).toHaveLength(ROW_COUNT)
  })
})
