import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  ensureRequiredEmptyDirectories,
  validateBackendSentinels,
  writeMqttTestEnv,
} from './bootstrap-supabase.mjs'

const VALID_CONFIG_TOML = 'enable_signup = false\n'
const VALID_SCHEMA_SQL = [
  'CREATE TABLE measurements (id bigint);',
  'GRANT UPDATE (name, location_ref, transport, provisioned) ON devices TO authenticated;',
  'CREATE MATERIALIZED VIEW mv_measurements_hourly AS SELECT 1;',
  'ALTER VIEW v_latest_readings SET (security_invoker = on);',
].join('\n')

let backendRoot

function writeFixture({
  configToml,
  schemaSql,
  skipConfig,
  skipMigration,
} = {}) {
  const supabaseDir = join(backendRoot, 'supabase')
  const migrationsDir = join(supabaseDir, 'migrations')
  mkdirSync(migrationsDir, { recursive: true })

  if (!skipConfig) {
    writeFileSync(
      join(supabaseDir, 'config.toml'),
      configToml ?? VALID_CONFIG_TOML,
    )
  }
  if (!skipMigration) {
    writeFileSync(
      join(migrationsDir, '20260909000000_initial_schema.sql'),
      schemaSql ?? VALID_SCHEMA_SQL,
    )
  }
}

afterEach(() => {
  if (backendRoot) {
    rmSync(backendRoot, { recursive: true, force: true })
  }
})

describe('validateBackendSentinels', () => {
  it('aborts naming supabase/config.toml when the file is missing', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    writeFixture({ skipConfig: true })

    expect(() => validateBackendSentinels(backendRoot)).toThrow(
      'supabase/config.toml',
    )
  })

  it('aborts naming supabase/migrations/*_initial_schema.sql when no migration matches', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    writeFixture({ skipMigration: true })

    expect(() => validateBackendSentinels(backendRoot)).toThrow(
      'supabase/migrations/*_initial_schema.sql',
    )
  })

  it('aborts naming the exact missing substring in config.toml', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    writeFixture({ configToml: 'enable_signup = true\n' })

    expect(() => validateBackendSentinels(backendRoot)).toThrow(
      'enable_signup = false',
    )
  })

  it('aborts naming the exact missing substring in the schema migration', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    writeFixture({
      schemaSql: [
        'CREATE TABLE measurements (id bigint);',
        'GRANT UPDATE (name, location_ref, transport, provisioned) ON devices TO authenticated;',
        'CREATE MATERIALIZED VIEW mv_measurements_hourly AS SELECT 1;',
      ].join('\n'),
    })

    expect(() => validateBackendSentinels(backendRoot)).toThrow(
      'security_invoker = on',
    )
  })

  it('does not throw when every sentinel is present', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    writeFixture()

    expect(() => validateBackendSentinels(backendRoot)).not.toThrow()
  })
})

describe('writeMqttTestEnv', () => {
  // The RC-8 broker test needs the Edge Function to see a full MQTT_WS_URL
  // pointing at the mosquitto container by name, never a real credential.
  it('writes MQTT_WS_URL pointing at the mosquitto container and throwaway credentials', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    mkdirSync(join(backendRoot, 'supabase', 'functions'), { recursive: true })

    writeMqttTestEnv(backendRoot)

    const content = readFileSync(
      join(backendRoot, 'supabase', 'functions', '.env'),
      'utf8',
    )
    expect(content).toContain('MQTT_WS_URL=ws://mosquitto:9001')
    expect(content).toContain('MQTT_USER=test')
    expect(content).toContain('MQTT_PASSWORD=test')
  })
})

describe('ensureRequiredEmptyDirectories', () => {
  // Git does not track empty directories, so a sparse checkout never
  // recreates `supabase/snippets`. `supabase start` bind-mounts it
  // regardless and fails outright when it is missing.
  it('creates supabase/snippets when the sparse checkout omitted it', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    mkdirSync(join(backendRoot, 'supabase'), { recursive: true })

    ensureRequiredEmptyDirectories(backendRoot)

    expect(existsSync(join(backendRoot, 'supabase', 'snippets'))).toBe(true)
  })

  it('does not throw when supabase/snippets already exists', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'bootstrap-supabase-'))
    mkdirSync(join(backendRoot, 'supabase', 'snippets'), { recursive: true })

    expect(() => ensureRequiredEmptyDirectories(backendRoot)).not.toThrow()
  })
})
