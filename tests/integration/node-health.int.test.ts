import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// CA-5 (REQ-RT-3) and CA-6 (REQ-NH-1), against the real local Supabase stack
// (D-6); nothing here is mocked. CA-5's proof is deliberately at the
// PostgREST layer rather than through `useRealtimeReadings`: the hook's own
// unit tests already prove the invalidation is requested exactly once for
// an unresolved sensor (see useRealtimeReadings.test.tsx); what only a real
// database can prove is that the refetch this invalidation triggers -- a
// plain `v_latest_readings` read -- actually surfaces a sensor that had zero
// rows a moment before, because it had zero measurements. Driving that
// through a live browser socket would test the Supabase SDK, not this app.

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

describe('node-health: unknown-sensor detection and device status (REQ-RT-3, REQ-NH-1, REQ-NH-2)', () => {
  const status = readLocalSupabaseStatus()

  // No generic here, same reason as the other integration files: database.types.ts
  // is a placeholder that only declares the columns each feature selects.
  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)
  const anonClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `node-health-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let createdSensorTypeId: string | null = null

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
      .insert({ mac_address: 'EE77FF88AA99', name: 'Node health test device' })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { data: sensorType, error: sensorTypeError } = await serviceRoleClient
      .from('sensor_types')
      .insert({ name: 'node-health-test', unit: 'unit' })
      .select('id')
      .single()
    if (sensorTypeError || !sensorType) {
      throw new Error(
        `Failed to seed a sensor type: ${sensorTypeError?.message}`,
      )
    }
    createdSensorTypeId = (sensorType as { id: string }).id
  })

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

  it('surfaces a brand-new sensor through v_latest_readings once its first measurement lands (CA-5)', async () => {
    const { data: sensor, error: sensorError } = await serviceRoleClient
      .from('sensors')
      .insert({
        device_id: createdDeviceId as string,
        type_id: createdSensorTypeId as string,
        source: 'node-health-test-source',
      })
      .select('id')
      .single()
    if (sensorError || !sensor) {
      throw new Error(`Failed to seed a sensor: ${sensorError?.message}`)
    }
    const newSensorId = (sensor as { id: string }).id

    // A sensor with zero measurements produces zero rows in v_latest_readings
    // (it's a join off `measurements`) -- this is what "unknown" looks like
    // from the dashboard's read path, regardless of RLS.
    const before = await authenticatedClient
      .from('v_latest_readings')
      .select('sensor_id')
      .eq('sensor_id', newSensorId)
    expect(before.data).toEqual([])

    const { error: measurementError } = await serviceRoleClient
      .from('measurements')
      .insert({
        sensor_id: newSensorId,
        value: 33.3,
        timestamp: new Date().toISOString(),
      })
    if (measurementError) {
      throw new Error(
        `Failed to insert the sensor's first measurement: ${measurementError.message}`,
      )
    }

    // This is the exact read the app's `invalidateQueries(['latestReadings'])`
    // triggers once REQ-RT-3's guard requests it.
    const after = await authenticatedClient
      .from('v_latest_readings')
      .select('sensor_id, value')
      .eq('sensor_id', newSensorId)
    expect(after.data).toEqual([{ sensor_id: newSensorId, value: 33.3 }])
  })

  it('delivers a service-role devices UPDATE to an authenticated subscriber (REQ-NH-1)', async () => {
    const channel = authenticatedClient.channel('devices-live-test', {
      config: { postgres_changes_options: { wait: true } },
    })

    const delivered = new Promise<{ new: { id: string; status: boolean } }>(
      (resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Timed out waiting for the realtime UPDATE')),
          5000,
        )
        channel.on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'devices' },
          (payload) => {
            const row = payload.new as { id: string; status: boolean }
            if (row.id === createdDeviceId) {
              clearTimeout(timer)
              resolve({ new: row })
            }
          },
        )
      },
    )

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Channel never reached SUBSCRIBED')),
        5000,
      )
      channel.subscribe((subscribeStatus) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          clearTimeout(timer)
          resolve()
        }
      })
    })

    const { error: updateError } = await serviceRoleClient
      .from('devices')
      .update({ status: false })
      .eq('id', createdDeviceId as string)
    if (updateError) {
      throw new Error(
        `Failed to update the device via service role: ${updateError.message}`,
      )
    }

    const payload = await delivered

    expect(payload.new.id).toBe(createdDeviceId)
    expect(payload.new.status).toBe(false)

    await authenticatedClient.removeChannel(channel)
  })

  // REQ-NH-2: raw_messages has RLS enabled with zero CREATE POLICY
  // statements, so it must return an empty result to every client -- not an
  // error, an empty set (D-9c's "no row leaks" shape, applied to a table
  // instead of a view). Seeding a real row first is the point: without it,
  // an empty result would prove nothing, since there would be nothing to
  // leak either way.
  it('returns raw_messages as empty for authenticated and anonymous clients despite a real row existing (REQ-NH-2)', async () => {
    const { data: seeded, error: seedError } = await serviceRoleClient
      .from('raw_messages')
      .insert({
        topic: 'dl/v1/EE77FF88AA99/data',
        payload: { value: 1 },
        source: 'hivemq',
      })
      .select('id')
      .single()
    if (seedError || !seeded) {
      throw new Error(
        `Failed to seed a raw_messages row: ${seedError?.message}`,
      )
    }
    const seededId = (seeded as { id: number }).id

    try {
      const authenticated = await authenticatedClient
        .from('raw_messages')
        .select('id')
        .eq('id', seededId)
      expect(authenticated.error).toBeNull()
      expect(authenticated.data).toEqual([])

      const anon = await anonClient
        .from('raw_messages')
        .select('id')
        .eq('id', seededId)
      if (anon.error) {
        expect(anon.error).not.toBeNull()
      } else {
        expect(anon.data).toEqual([])
      }
    } finally {
      await serviceRoleClient.from('raw_messages').delete().eq('id', seededId)
    }
  })
})
