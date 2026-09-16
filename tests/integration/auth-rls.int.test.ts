import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// This is the first real RLS scenario in the project (REQ-AUTH-4): an
// authenticated session can read `devices`, and an anonymous session cannot
// see the same row, even though it genuinely exists. Runs against the real
// local Supabase stack bootstrapped from the backend repo (D-6); nothing
// here is mocked.

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

describe('single-user-auth: authenticated read access (REQ-AUTH-4)', () => {
  const status = readLocalSupabaseStatus()

  // No generic here: src/lib/database.types.ts is a placeholder (D-4) with
  // no real tables yet, so a typed client would reject every `.from()` call
  // in this file.
  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const anonClient = createClient(status.API_URL, status.ANON_KEY)
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `auth-rls-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null

  beforeAll(async () => {
    // Seeds a real user through the admin API, bypassing the disabled
    // public signup path on purpose (REQ-AUTH-3) — this is how the single
    // account is actually provisioned, by an operator, not by a client.
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
      .insert({ mac_address: 'AA11BB22CC33', name: 'RLS test device' })
      .select('id')
      .single()
    if (deviceError || !device) {
      throw new Error(`Failed to seed a test device: ${deviceError?.message}`)
    }
    createdDeviceId = (device as { id: string }).id
  })

  afterAll(async () => {
    if (createdDeviceId) {
      await serviceRoleClient.from('devices').delete().eq('id', createdDeviceId)
    }
    if (createdUserId) {
      await serviceRoleClient.auth.admin.deleteUser(createdUserId)
    }
  })

  it('lets an authenticated session read the seeded device with no RLS error', async () => {
    const { data, error } = await authenticatedClient
      .from('devices')
      .select('id')
      .eq('id', createdDeviceId as string)

    expect(error).toBeNull()
    expect(data).toEqual([{ id: createdDeviceId }])
  })

  it('does not let an anonymous session see the same device', async () => {
    const { data, error } = await anonClient
      .from('devices')
      .select('id')
      .eq('id', createdDeviceId as string)

    if (error) {
      expect(error).not.toBeNull()
    } else {
      expect(data).toEqual([])
    }
  })

  // REQ-AUTH-3: the backend's config.toml sets enable_signup = false. The
  // seeded user above proves the ONLY way an account is created is through
  // the admin API (bypassing signup entirely); this test proves the client
  // path a real attacker or a stray UI regression would use is rejected.
  it('rejects a signUp attempt against the local stack (REQ-AUTH-3, enable_signup=false)', async () => {
    const signupEmail = `auth-signup-disabled-${Date.now()}@example.com`

    const { data, error } = await anonClient.auth.signUp({
      email: signupEmail,
      password: testPassword,
    })

    expect(error).not.toBeNull()
    expect(data.user).toBeNull()
    expect(data.session).toBeNull()
  })
})
