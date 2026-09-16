import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

// pg_cron activation and the hourly/daily refresh schedule (REQ-AGG-1,
// REQ-AGG-2, REQ-AGG-3), against the real local Supabase stack (D-6).
// Neither PostgREST nor supabase-js expose pg_catalog or the cron schema,
// so these assertions run through `supabase db query`, the same
// execFileSync pattern historical-aggregates.int.test.ts already uses for
// the matview refresh. The migration guards pg_cron behind a
// pg_available_extensions check because a bare postgres image (the backend
// testcontainers suite) does not ship it, but the local CLI stack this
// suite runs against does -- so these tests assert the real schedule, not
// the guard's skip path.

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')

interface SqlQueryResult<T> {
  rows: T[]
}

function queryLocalDb<T>(sql: string): T[] {
  const output = execFileSync(
    'supabase',
    ['db', 'query', sql, '--local', '--output-format', 'json'],
    { cwd: BACKEND_DIR, encoding: 'utf8' },
  )
  return (JSON.parse(output) as SqlQueryResult<T>).rows
}

describe('aggregation-schedule: pg_cron and refresh jobs (REQ-AGG-1, REQ-AGG-2, REQ-AGG-3)', () => {
  it('has the pg_cron extension installed (REQ-AGG-1)', () => {
    const rows = queryLocalDb<{ extname: string }>(
      "select extname from pg_extension where extname = 'pg_cron'",
    )

    expect(rows).toEqual([{ extname: 'pg_cron' }])
  })

  it('schedules the hourly matview refresh, active, at 5 minutes past the hour (REQ-AGG-2)', () => {
    const rows = queryLocalDb<{ schedule: string; active: boolean }>(
      "select schedule, active from cron.job where jobname = 'refresh-hourly'",
    )

    expect(rows).toEqual([{ schedule: '5 * * * *', active: true }])
  })

  it('schedules the daily matview refresh, active, at 00:10 UTC (REQ-AGG-3)', () => {
    const rows = queryLocalDb<{ schedule: string; active: boolean }>(
      "select schedule, active from cron.job where jobname = 'refresh-daily'",
    )

    expect(rows).toEqual([{ schedule: '10 0 * * *', active: true }])
  })
})
