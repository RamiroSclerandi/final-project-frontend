import { describe, expect, it } from 'vitest'

import { normalizeQuality } from './quality'

describe('normalizeQuality', () => {
  it('passes through ok and out_of_range unchanged', () => {
    expect(normalizeQuality('ok')).toBe('ok')
    expect(normalizeQuality('out_of_range')).toBe('out_of_range')
  })

  it('falls back to ok for an unrecognised value', () => {
    expect(normalizeQuality('garbage')).toBe('ok')
  })
})
