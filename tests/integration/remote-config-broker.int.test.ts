import mqtt from 'mqtt'
import { describe, expect, it } from 'vitest'

// End-to-end broker delivery (REQ-RC-8): the deployed `set-sampling-interval`
// Edge Function must actually reach the real broker. Every other suite that
// touches this path fakes the MQTT boundary -- the backend's own
// `mqtt.test.ts`/`index.test.ts`, and this repo's own
// `remote-config.int.test.ts` -- so REQ-RC-8 has never been exercised by an
// automated regression test, only by two rounds of direct human observation
// (the S3 spike and the Increment 4 end-to-end session, both recorded in
// sdd/frontend-dashboard/verify-report). This file closes that gap without
// ever holding a broker credential in CI: it is a complete no-op unless a
// human supplies every MQTT_TEST_* var below, locally, using the worker's
// own Subscribe-Only credential (never a new one minted for this file) and
// their own dashboard session's access token.
//
// Required env vars, all MQTT_TEST_*-prefixed:
//   MQTT_TEST_HOST            HiveMQ cluster host (no scheme, no port)
//   MQTT_TEST_WS_PORT         WebSocket port (8884 on this project's cluster)
//   MQTT_TEST_USER            the worker's Subscribe-Only username
//   MQTT_TEST_PASSWORD        the worker's Subscribe-Only password
//   MQTT_TEST_USER_JWT        a real dashboard session's access_token
//   MQTT_TEST_FUNCTIONS_URL   deployed function URL, e.g.
//                             https://<project-ref>.supabase.co/functions/v1/set-sampling-interval
//   MQTT_TEST_DEVICE_ID       UUID of a devices row the session's RLS can
//                             read (the seeded Cloud test device, MAC
//                             AABBCCDDEEFF, already exists for this purpose)
//
// No credential is ever read from a repo file or committed anywhere; all
// seven are supplied by the human running the test locally.

const REQUIRED_ENV_VARS = [
  'MQTT_TEST_HOST',
  'MQTT_TEST_WS_PORT',
  'MQTT_TEST_USER',
  'MQTT_TEST_PASSWORD',
  'MQTT_TEST_USER_JWT',
  'MQTT_TEST_FUNCTIONS_URL',
  'MQTT_TEST_DEVICE_ID',
] as const

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

const canRun = REQUIRED_ENV_VARS.every((name) => Boolean(process.env[name]))

if (!canRun) {
  console.info('REQ-RC-8 broker test skipped: set MQTT_TEST_* to run')
}

function requireEnv(name: RequiredEnvVar): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set to run this test`)
  }
  return value
}

describe.skipIf(!canRun)(
  'remote-config: end-to-end broker delivery (REQ-RC-8)',
  () => {
    it('delivers the published sampling interval to a broker subscriber once the deployed function runs', async () => {
      const host = requireEnv('MQTT_TEST_HOST')
      const wsPort = requireEnv('MQTT_TEST_WS_PORT')
      const username = requireEnv('MQTT_TEST_USER')
      const password = requireEnv('MQTT_TEST_PASSWORD')
      const userJwt = requireEnv('MQTT_TEST_USER_JWT')
      const functionsUrl = requireEnv('MQTT_TEST_FUNCTIONS_URL')
      const deviceId = requireEnv('MQTT_TEST_DEVICE_ID')

      const client = mqtt.connect(`wss://${host}:${wsPort}/mqtt`, {
        username,
        password,
        protocolVersion: 5,
      })

      try {
        await new Promise<void>((resolve, reject) => {
          client.once('connect', () => resolve())
          client.once('error', reject)
        })

        await new Promise<void>((resolve, reject) => {
          client.subscribe('dl/v1/+/config', { qos: 1 }, (error) =>
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

        const response = await fetch(functionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userJwt}`,
          },
          body: JSON.stringify({ deviceId, samplingIntervalMs }),
        })
        expect(response.ok).toBe(true)

        await expect(delivered).resolves.toEqual({
          samplingInterval: samplingIntervalMs,
        })
      } finally {
        client.end(true)
      }
    }, 30_000)
  },
)
