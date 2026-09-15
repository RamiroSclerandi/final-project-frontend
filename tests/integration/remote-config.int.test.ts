import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// `device_configs` RLS surface the remote-config UI reads and writes
// (REQ-AUTH-4, D-5), against the real local Supabase stack (D-6). The
// `set-sampling-interval` Edge Function itself is NOT exercised here: it
// needs `supabase functions serve`, Deno, and real/faked broker secrets this
// harness does not have. Its wire format and broker delivery are proven in
// the backend repo's own suite and by the S3 spike's observer confirmation
// (REQ-RC-8); this file proves the table surface the UI's reads/writes land
// on behaves as designed.

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

describe('remote-config: device_configs access (REQ-AUTH-4)', () => {
  const status = readLocalSupabaseStatus()

  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const anonClient = createClient(status.API_URL, status.ANON_KEY)
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `remote-config-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null

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
        mac_address: 'AA00BB11CC22',
        name: 'Remote config test device',
      })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id

    const { error: configError } = await serviceRoleClient
      .from('device_configs')
      .insert({ device_id: createdDeviceId, sampling_interval_ms: 10000 })
    if (configError) {
      throw new Error(
        `Failed to seed a device_configs row: ${configError.message}`,
      )
    }
  })

  afterAll(async () => {
    if (createdDeviceId) {
      await serviceRoleClient.from('devices').delete().eq('id', createdDeviceId)
    }
    if (createdUserId) {
      await serviceRoleClient.auth.admin.deleteUser(createdUserId)
    }
  })

  it('lets an authenticated session read the seeded config with no RLS error', async () => {
    const { data, error } = await authenticatedClient
      .from('device_configs')
      .select('sampling_interval_ms')
      .eq('device_id', createdDeviceId as string)
      .single()

    expect(error).toBeNull()
    expect(data).toEqual({ sampling_interval_ms: 10000 })
  })

  it('does not let an anonymous session read the same config', async () => {
    const { data, error } = await anonClient
      .from('device_configs')
      .select('sampling_interval_ms')
      .eq('device_id', createdDeviceId as string)

    if (error) {
      expect(error).not.toBeNull()
    } else {
      expect(data).toEqual([])
    }
  })

  // Known debt (spec remote-config, accepted not fixed here): the
  // `upsert_device_configs` policy is `FOR ALL TO authenticated USING (true)`,
  // so ANY authenticated session can write ANY device's config directly,
  // bypassing the Edge Function entirely. Acceptable only while single-user;
  // must close before a second user exists. This assertion is the tripwire:
  // it starts failing the day someone tightens the policy, which is exactly
  // when this comment needs a second look.
  it('lets an authenticated session write device_configs directly, bypassing the function (documented debt)', async () => {
    const { error } = await authenticatedClient
      .from('device_configs')
      .update({ sampling_interval_ms: 20000 })
      .eq('device_id', createdDeviceId as string)
    expect(error).toBeNull()

    const { data } = await serviceRoleClient
      .from('device_configs')
      .select('sampling_interval_ms')
      .eq('device_id', createdDeviceId as string)
      .single()
    expect(
      (data as { sampling_interval_ms: number } | null)?.sampling_interval_ms,
    ).toBe(20000)
  })
})
