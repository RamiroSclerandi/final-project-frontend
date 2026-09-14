import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// RLS on `measurements` and `v_latest_readings` (REQ-AUTH-4, REQ-HS-5/6,
// D-9c): authenticated can read both, anonymous cannot read either, and an
// authenticated client's INSERT into `measurements` is rejected -- there is
// deliberately no insert policy (§7.1); only the worker's service_role
// writes. That third assertion is the client-side proof of that removal.
// Runs against the real local Supabase stack (D-6); nothing here is mocked.

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

describe('realtime-telemetry: measurements RLS (REQ-AUTH-4, REQ-HS-5/6, REQ-RT-4)', () => {
  const status = readLocalSupabaseStatus()

  // No generic here, same reason as auth-rls.int.test.ts: database.types.ts
  // is a placeholder that only declares v_latest_readings' select columns.
  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const anonClient = createClient(status.API_URL, status.ANON_KEY)
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `measurements-rls-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let createdSensorTypeId: string | null = null
  let createdSensorId: string | null = null
  const seedTimestamp = new Date().toISOString()

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
      .insert({
        mac_address: 'DD44EE55FF66',
        name: 'Measurements RLS test device',
      })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { data: sensorType, error: sensorTypeError } = await serviceRoleClient
      .from('sensor_types')
      .insert({ name: 'measurements-rls-test', unit: 'unit' })
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
        source: 'test-source',
      })
      .select('id')
      .single()
    if (sensorError || !sensor) {
      throw new Error(`Failed to seed a sensor: ${sensorError?.message}`)
    }
    createdSensorId = (sensor as { id: string }).id

    const { error: measurementError } = await serviceRoleClient
      .from('measurements')
      .insert({
        sensor_id: createdSensorId,
        value: 21.5,
        timestamp: seedTimestamp,
      })
    if (measurementError) {
      throw new Error(
        `Failed to seed a measurement: ${measurementError.message}`,
      )
    }
  })

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

  it('lets an authenticated session read the seeded measurement with no RLS error', async () => {
    const { data, error } = await authenticatedClient
      .from('measurements')
      .select('sensor_id, value')
      .eq('sensor_id', createdSensorId as string)

    expect(error).toBeNull()
    expect(data).toEqual([{ sensor_id: createdSensorId, value: 21.5 }])
  })

  it('does not let an anonymous session read the same measurement', async () => {
    const { data, error } = await anonClient
      .from('measurements')
      .select('sensor_id')
      .eq('sensor_id', createdSensorId as string)

    if (error) {
      expect(error).not.toBeNull()
    } else {
      expect(data).toEqual([])
    }
  })

  it('lets an authenticated session read the row through v_latest_readings', async () => {
    const { data, error } = await authenticatedClient
      .from('v_latest_readings')
      .select('sensor_id, value')
      .eq('sensor_id', createdSensorId as string)

    expect(error).toBeNull()
    expect(data).toEqual([{ sensor_id: createdSensorId, value: 21.5 }])
  })

  it('does not let an anonymous session read v_latest_readings', async () => {
    const { data, error } = await anonClient
      .from('v_latest_readings')
      .select('sensor_id')
      .eq('sensor_id', createdSensorId as string)

    if (error) {
      expect(error).not.toBeNull()
    } else {
      expect(data).toEqual([])
    }
  })

  it('rejects an authenticated client INSERT into measurements (REQ-RT-4, §7.1)', async () => {
    const { error, data } = await authenticatedClient
      .from('measurements')
      .insert({
        sensor_id: createdSensorId as string,
        value: 99,
        timestamp: new Date().toISOString(),
      })
      .select('id')

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it('delivers a service-role insert to an authenticated subscriber under 2000ms (REQ-RT-1)', async () => {
    // wait: true holds SUBSCRIBED until the server confirms the
    // postgres_changes replication is actually streaming, not just that the
    // channel joined -- without it, an insert right after SUBSCRIBED can
    // race the replication slot and never arrive.
    const channel = authenticatedClient.channel('measurements-live-test', {
      config: { postgres_changes_options: { wait: true } },
    })

    const delivered = new Promise<{
      new: { sensor_id: string; value: number }
    }>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timed out waiting for the realtime INSERT')),
        5000,
      )
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'measurements' },
        (payload) => {
          const row = payload.new as { sensor_id: string; value: number }
          if (row.sensor_id === createdSensorId) {
            clearTimeout(timer)
            resolve({ new: row })
          }
        },
      )
    })

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

    const t0 = performance.now()
    const { error: insertError } = await serviceRoleClient
      .from('measurements')
      .insert({
        sensor_id: createdSensorId as string,
        value: 42.5,
        timestamp: new Date().toISOString(),
      })
    if (insertError) {
      throw new Error(
        `Failed to insert via service role: ${insertError.message}`,
      )
    }

    const payload = await delivered
    const elapsedMs = performance.now() - t0

    expect(payload.new.sensor_id).toBe(createdSensorId)
    expect(payload.new.value).toBe(42.5)
    expect(elapsedMs).toBeLessThan(2000)

    await authenticatedClient.removeChannel(channel)
  })
})
