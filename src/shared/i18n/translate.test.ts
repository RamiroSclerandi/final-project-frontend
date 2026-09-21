import { afterEach, describe, expect, it, vi } from 'vitest'

import { translate } from './translate'

const fixture = {
  shell: { brand: 'Fleet Monitor' },
  greeting: 'Hello {name}',
  fleet: {
    kpi: { nodes: { one: '{count} node', other: '{count} nodes' } },
  },
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('translate', () => {
  it('resolves a nested string key', () => {
    expect(translate(fixture, 'en', 'shell.brand')).toBe('Fleet Monitor')
  })

  it('interpolates {param} placeholders from the params object', () => {
    expect(translate(fixture, 'en', 'greeting', { name: 'Ada' })).toBe(
      'Hello Ada',
    )
  })

  it('selects the singular plural form for count = 1', () => {
    expect(translate(fixture, 'en', 'fleet.kpi.nodes', { count: 1 })).toBe(
      '1 node',
    )
  })

  it('selects the plural form for count = 5', () => {
    expect(translate(fixture, 'en', 'fleet.kpi.nodes', { count: 5 })).toBe(
      '5 nodes',
    )
  })

  it('throws on an unknown key outside production', () => {
    expect(() => translate(fixture, 'en', 'nope.missing')).toThrow(
      /Missing translation "nope.missing"/,
    )
  })

  it('returns the raw key for an unknown key in production', () => {
    vi.stubEnv('MODE', 'production')

    expect(translate(fixture, 'en', 'nope.missing')).toBe('nope.missing')
  })
})
