#!/usr/bin/env node
// Cross-repo integration bootstrap (D-6): sparse-checks-out proyecto-final-backend's
// `supabase/` directory into the gitignored `.supabase-backend/`, pinned to the SHA
// in supabase-backend.lock.json, then asserts the contract sentinel list below
// before `supabase start` runs. A missing sentinel aborts loudly, naming the exact
// missing item, instead of letting the integration suite pass against a schema
// missing the thing it claims to prove (threat matrix: git repository selection).

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const CHECKOUT_DIR = join(REPO_ROOT, '.supabase-backend')
const LOCK_FILE = join(REPO_ROOT, 'supabase-backend.lock.json')

const CONFIG_PATH = 'supabase/config.toml'
const SCHEMA_MIGRATION_GLOB = 'supabase/migrations/*_initial_schema.sql'

const CONFIG_SENTINELS = ['enable_signup = false']
const SCHEMA_SENTINELS = [
  'CREATE TABLE measurements',
  'GRANT UPDATE (name, location_ref',
  'mv_measurements_hourly',
  'security_invoker = on',
]

/**
 * Finds the migration file matching `*_initial_schema.sql` inside a
 * migrations directory, or `null` if the directory or the file is absent.
 */
function findInitialSchemaMigration(migrationsDir) {
  if (!existsSync(migrationsDir)) {
    return null
  }
  const match = readdirSync(migrationsDir).find((name) =>
    name.endsWith('_initial_schema.sql'),
  )
  return match ? join(migrationsDir, match) : null
}

function assertSubstrings(filePath, sentinelLabel, requiredSubstrings) {
  const content = readFileSync(filePath, 'utf8')
  for (const sentinel of requiredSubstrings) {
    if (!content.includes(sentinel)) {
      throw new Error(
        `Missing sentinel: required substring not found in ${sentinelLabel} — "${sentinel}"`,
      )
    }
  }
}

/**
 * Asserts the backend checkout at `backendRoot` still matches the contract
 * this repo depends on. Throws an Error naming the exact missing path or
 * substring; never fails silently or partially.
 */
export function validateBackendSentinels(backendRoot) {
  const configPath = join(backendRoot, CONFIG_PATH)
  if (!existsSync(configPath)) {
    throw new Error(
      `Missing sentinel: required file not found — ${CONFIG_PATH}`,
    )
  }

  const migrationsDir = join(backendRoot, 'supabase', 'migrations')
  const schemaPath = findInitialSchemaMigration(migrationsDir)
  if (!schemaPath) {
    throw new Error(
      `Missing sentinel: required file not found — ${SCHEMA_MIGRATION_GLOB}`,
    )
  }

  assertSubstrings(schemaPath, SCHEMA_MIGRATION_GLOB, SCHEMA_SENTINELS)
  assertSubstrings(configPath, CONFIG_PATH, CONFIG_SENTINELS)
}

/**
 * Creates directories the sparse checkout can never recreate on its own,
 * because git does not track empty directories. `supabase start`
 * bind-mounts `supabase/snippets` regardless and fails outright if it is
 * missing.
 */
export function ensureRequiredEmptyDirectories(backendRoot) {
  const snippetsDir = join(backendRoot, 'supabase', 'snippets')
  if (!existsSync(snippetsDir)) {
    mkdirSync(snippetsDir, { recursive: true })
  }
}

/**
 * Points the Edge Function's MQTT_WS_URL at the throwaway test broker
 * (`scripts/test-broker.mjs`) by container name, so `supabase start`'s
 * edge-runtime container reaches it over the network they share (REQ-RC-8).
 * Never a real broker credential -- mosquitto runs with anonymous access.
 */
export function writeMqttTestEnv(backendRoot) {
  const envPath = join(backendRoot, 'supabase', 'functions', '.env')
  const content = [
    'MQTT_WS_URL=ws://mosquitto:9001',
    'MQTT_USER=test',
    'MQTT_PASSWORD=test',
    '',
  ].join('\n')
  writeFileSync(envPath, content)
}

function readLockFile() {
  if (!existsSync(LOCK_FILE)) {
    throw new Error(
      `Missing sentinel: required file not found — supabase-backend.lock.json`,
    )
  }
  return JSON.parse(readFileSync(LOCK_FILE, 'utf8'))
}

function sparseCheckoutBackend({ remote, commit, sparsePath }) {
  const git = (args) =>
    execFileSync('git', args, { cwd: CHECKOUT_DIR, stdio: 'inherit' })

  if (!existsSync(CHECKOUT_DIR)) {
    execFileSync('git', ['init', CHECKOUT_DIR], { stdio: 'inherit' })
    execFileSync(
      'git',
      ['-C', CHECKOUT_DIR, 'remote', 'add', 'origin', remote],
      {
        stdio: 'inherit',
      },
    )
  }
  git(['sparse-checkout', 'set', sparsePath])
  git([...authConfig(), 'fetch', '--depth', '1', 'origin', commit])
  git(['checkout', 'FETCH_HEAD'])
}

// The backend repo is private. In CI a read-only token arrives via
// BACKEND_READ_TOKEN and is sent as a header for this one fetch, so it never
// lands in a URL, in .git/config, or in the process list. Locally the
// developer's own git credentials apply and this returns nothing.
function authConfig() {
  const token = process.env.BACKEND_READ_TOKEN
  if (!token) return []
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64')
  return ['-c', `http.extraheader=AUTHORIZATION: basic ${basic}`]
}

function main() {
  const lock = readLockFile()
  sparseCheckoutBackend(lock)
  ensureRequiredEmptyDirectories(CHECKOUT_DIR)
  writeMqttTestEnv(CHECKOUT_DIR)
  validateBackendSentinels(CHECKOUT_DIR)
  console.log('bootstrap-supabase: backend contract verified.')
}

// Only run the network/git side effects when invoked directly, so importing
// `validateBackendSentinels` for tests never touches git or the filesystem
// outside the caller's own fixture. Compared via `pathToFileURL` (not a
// naive `file://` string concat) so this also matches on Windows, where a
// path uses backslashes and a bare drive letter instead of a POSIX path.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
