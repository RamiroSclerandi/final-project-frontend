import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Column-scoped grants on `devices`/`sensors` (REQ-DM-1/2/3/4, D-column-scoped
// grants), against the real local Supabase stack (D-6); nothing here is
// mocked. Uses ad-hoc clients built from `supabase status`, same as every
// other integration file -- the production `supabase` singleton reads
// `VITE_SUPABASE_URL` from `.env`, which targets interactive dev (often the
// deployed Cloud project), not this ephemeral local stack. `updateDevice`/
// `updateSensor` are proven at the unit layer (REQ-DM-1/2/3) to send ONLY
// the allowlisted payload; this file proves the grant surface those payloads
// land on actually behaves as designed.

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

describe('device-management: column-scoped grants (REQ-DM-1/2/3/4)', () => {
  const status = readLocalSupabaseStatus()

  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const anonClient = createClient(status.API_URL, status.ANON_KEY)
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `device-management-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let createdSensorTypeId: string | null = null
  let createdSensorId: string | null = null

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
      .insert({ mac_address: 'CC55DD66EE77', name: 'Original name' })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { data: sensorType, error: sensorTypeError } = await serviceRoleClient
      .from('sensor_types')
      .insert({ name: 'device-management-test', unit: 'unit' })
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
        source: 'device-management-source',
        label: 'Original label',
      })
      .select('id')
      .single()
    if (sensorError || !sensor) {
      throw new Error(`Failed to seed a sensor: ${sensorError?.message}`)
    }
    createdSensorId = (sensor as { id: string }).id
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

  it('renames a device and updates its location, visible on re-read (REQ-DM-1/2)', async () => {
    const { error: updateError } = await authenticatedClient
      .from('devices')
      .update({ name: 'Renamed device', location_ref: 'Server room' })
      .eq('id', createdDeviceId as string)
    expect(updateError).toBeNull()

    const { data, error } = await serviceRoleClient
      .from('devices')
      .select('name, location_ref')
      .eq('id', createdDeviceId as string)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({
      name: 'Renamed device',
      location_ref: 'Server room',
    })
  })

  it("updates a sensor's label (REQ-DM-3)", async () => {
    const { error: updateError } = await authenticatedClient
      .from('sensors')
      .update({ label: 'Renamed label' })
      .eq('id', createdSensorId as string)
    expect(updateError).toBeNull()

    const { data, error } = await serviceRoleClient
      .from('sensors')
      .select('label')
      .eq('id', createdSensorId as string)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({ label: 'Renamed label' })
  })

  it('rejects an authenticated UPDATE that includes mac_address, leaving it unchanged (REQ-DM-4, §7.2)', async () => {
    const { error } = await authenticatedClient
      .from('devices')
      .update({ name: 'Attempted rename', mac_address: 'BADBADBADBAD' })
      .eq('id', createdDeviceId as string)

    expect(error).not.toBeNull()

    const { data } = await serviceRoleClient
      .from('devices')
      .select('mac_address')
      .eq('id', createdDeviceId as string)
      .single()
    expect((data as { mac_address: string } | null)?.mac_address).toBe(
      'CC55DD66EE77',
    )
  })

  it('does not let an anonymous session update a device', async () => {
    // RLS restricts the UPDATE policy to `authenticated`; an anon request
    // matches zero rows rather than raising an explicit error, so the real
    // assertion is that the row is provably unchanged (same pattern as the
    // anon-read checks in measurements-rls.int.test.ts).
    await anonClient
      .from('devices')
      .update({ name: 'Anon rename' })
      .eq('id', createdDeviceId as string)

    const { data } = await serviceRoleClient
      .from('devices')
      .select('name')
      .eq('id', createdDeviceId as string)
      .single()
    expect((data as { name: string } | null)?.name).not.toBe('Anon rename')
  })
})
