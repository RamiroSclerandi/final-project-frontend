import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { networkNameForProject, readProjectId } from './test-broker.mjs'

let backendRoot

afterEach(() => {
  if (backendRoot) {
    rmSync(backendRoot, { recursive: true, force: true })
  }
})

describe('readProjectId', () => {
  it('reads project_id out of supabase/config.toml', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'test-broker-'))
    mkdirSync(join(backendRoot, 'supabase'), { recursive: true })
    writeFileSync(
      join(backendRoot, 'supabase', 'config.toml'),
      'project_id = "proyecto-final-backend"\n[api]\nenabled = true\n',
    )

    expect(readProjectId(backendRoot)).toBe('proyecto-final-backend')
  })

  it('throws naming the file when project_id is missing', () => {
    backendRoot = mkdtempSync(join(tmpdir(), 'test-broker-'))
    mkdirSync(join(backendRoot, 'supabase'), { recursive: true })
    writeFileSync(join(backendRoot, 'supabase', 'config.toml'), '[api]\n')

    expect(() => readProjectId(backendRoot)).toThrow('project_id')
  })
})

describe('networkNameForProject', () => {
  // Matches the CLI's own default network naming, confirmed empirically
  // (`podman network ls` after `supabase start`) rather than guessed.
  it('matches the network name supabase start generates', () => {
    expect(networkNameForProject('proyecto-final-backend')).toBe(
      'supabase_network_proyecto-final-backend',
    )
  })
})
