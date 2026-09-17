import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// Browser-shaped CORS coverage for `set-sampling-interval` (REQ-RC-9). Every
// existing test for this function calls its handler in-process
// (`createHandler`) or, for the broker test, does a real `fetch()` but never
// sends `Origin` or issues a preflight `OPTIONS` request first. This file
// closes that gap with a real HTTP round trip carrying `Origin`, against the
// same local Edge Function the broker test already targets. No device or
// session is seeded: the preflight case needs neither, and the POST case
// only needs to prove the CORS header survives an unsuccessful request.

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')

interface LocalSupabaseStatus {
  API_URL: string
  ANON_KEY: string
}

function readLocalSupabaseStatus(): LocalSupabaseStatus {
  const output = execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
  })
  return JSON.parse(output) as LocalSupabaseStatus
}

describe('remote-config: browser-shaped CORS round trip (REQ-RC-9)', () => {
  const status = readLocalSupabaseStatus()
  const functionUrl = `${status.API_URL}/functions/v1/set-sampling-interval`

  it('answers a real OPTIONS preflight with the headers a browser needs, with no seeding required', async () => {
    const origin = 'http://localhost:5173'
    const response = await fetch(functionUrl, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type, apikey',
      },
    })

    // The gateway (Kong locally) may answer the preflight before the function
    // does; a browser only needs a 2xx carrying these headers, so this test
    // verifies that contract regardless of who answers it.
    expect(response.status).toBeGreaterThanOrEqual(200)
    expect(response.status).toBeLessThan(300)

    const allowOrigin = response.headers.get('access-control-allow-origin')
    expect(allowOrigin === '*' || allowOrigin === origin).toBe(true)

    expect(response.headers.get('access-control-allow-methods')).toContain(
      'POST',
    )

    const allowHeaders =
      response.headers.get('access-control-allow-headers')?.toLowerCase() ?? ''
    expect(allowHeaders).toContain('authorization')
    expect(allowHeaders).toContain('apikey')
    expect(allowHeaders).toContain('content-type')
  })

  it('carries CORS headers on a real POST response, regardless of status', async () => {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:5173',
        apikey: status.ANON_KEY,
        Authorization: `Bearer ${status.ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    expect([400, 401]).toContain(response.status)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
  })
})
