import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'
import mqtt from 'mqtt'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// End-to-end broker delivery (REQ-RC-8): the deployed `set-sampling-interval`
// Edge Function must actually reach a real broker over MQTT-over-WebSocket.
// Every other suite that touches this path fakes the MQTT boundary -- the
// backend's own `mqtt.test.ts`/`index.test.ts`, and this repo's own
// `remote-config.int.test.ts` -- so this file closes that gap with a real
// broker, runnable identically locally and in CI, no secret ever required:
// the broker is `eclipse-mosquitto`, anonymous, throwaway, joined to the
// same Docker/Podman network `supabase start` creates (see
// `scripts/test-broker.mjs`), and the local Auth stack signs its own JWTs --
// no Cloud credential is involved anywhere in this test.

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')
const BROKER_WS_URL = 'ws://localhost:9001'
const TEST_MAC = 'AABBCCDDEEFF'

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

describe('remote-config: end-to-end broker delivery (REQ-RC-8)', () => {
  const status = readLocalSupabaseStatus()

  const serviceRoleClient = createClient(
    status.API_URL,
    status.SERVICE_ROLE_KEY,
  )
  const authenticatedClient = createClient(status.API_URL, status.ANON_KEY)

  const testEmail = `remote-config-broker-${Date.now()}@example.com`
  const testPassword = 'correct horse battery staple'
  let createdUserId: string | null = null
  let createdDeviceId: string | null = null
  let accessToken: string | null = null

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

    const { data: signInData, error: signInError } =
      await authenticatedClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
    if (signInError || !signInData.session) {
      throw new Error(
        `Failed to sign in the test user: ${signInError?.message}`,
      )
    }
    accessToken = signInData.session.access_token

    const { data: device, error: deviceError } = await serviceRoleClient
      .from('devices')
      .insert({ mac_address: TEST_MAC, name: 'RC-8 broker test device' })
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

  it('delivers the published sampling interval to a broker subscriber', async () => {
    const client = mqtt.connect(BROKER_WS_URL, { protocolVersion: 5 })

    try {
      await new Promise<void>((resolve, reject) => {
        client.once('connect', () => resolve())
        client.once('error', reject)
      })

      await new Promise<void>((resolve, reject) => {
        client.subscribe(`dl/v1/${TEST_MAC}/config`, { qos: 1 }, (error) =>
          error ? reject(error) : resolve(),
        )
      })

      const samplingIntervalMs = 15000
      const delivered = new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                'Timed out waiting for the broker to deliver the config message',
              ),
            ),
          15_000,
        )
        client.once('message', (_topic, payload) => {
          clearTimeout(timer)
          resolve(JSON.parse(payload.toString()))
        })
      })

      const response = await fetch(
        `${status.API_URL}/functions/v1/set-sampling-interval`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: status.ANON_KEY,
          },
          body: JSON.stringify({
            deviceId: createdDeviceId,
            samplingIntervalMs,
          }),
        },
      )
      expect(response.status).toBe(200)

      await expect(delivered).resolves.toEqual({
        samplingInterval: samplingIntervalMs,
      })

      const { data: configRow, error: configError } = await serviceRoleClient
        .from('device_configs')
        .select('sampling_interval_ms')
        .eq('device_id', createdDeviceId as string)
        .single()
      expect(configError).toBeNull()
      expect(
        (configRow as { sampling_interval_ms: number } | null)
          ?.sampling_interval_ms,
      ).toBe(samplingIntervalMs)
    } finally {
      client.end(true)
    }
  }, 30_000)
})
