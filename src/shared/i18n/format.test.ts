import { describe, expect, it } from 'vitest'

import { formatRelativeTime } from './format'

const NOW_MS = Date.parse('2026-09-21T12:00:00.000Z')

function isoOffsetBy(deltaMs: number): string {
  return new Date(NOW_MS + deltaMs).toISOString()
}

describe('formatRelativeTime', () => {
  it('uses seconds below one minute', () => {
    expect(formatRelativeTime('en', isoOffsetBy(-59_000), NOW_MS)).toBe(
      '59 seconds ago',
    )
  })

  it('switches to minutes at exactly one minute', () => {
    expect(formatRelativeTime('en', isoOffsetBy(-60_000), NOW_MS)).toBe(
      '1 minute ago',
    )
  })

  it('switches to hours at exactly one hour', () => {
    expect(formatRelativeTime('en', isoOffsetBy(-3_600_000), NOW_MS)).toBe(
      '1 hour ago',
    )
  })

  it('switches to days at exactly one day', () => {
    expect(formatRelativeTime('en', isoOffsetBy(-86_400_000), NOW_MS)).toBe(
      'yesterday',
    )
  })

  it('keeps hours just below the day boundary', () => {
    expect(formatRelativeTime('en', isoOffsetBy(-86_399_000), NOW_MS)).toBe(
      '24 hours ago',
    )
  })

  it('formats future timestamps forwards', () => {
    expect(formatRelativeTime('en', isoOffsetBy(120_000), NOW_MS)).toBe(
      'in 2 minutes',
    )
  })

  it('formats in the active locale', () => {
    expect(formatRelativeTime('es', isoOffsetBy(-7_200_000), NOW_MS)).toBe(
      'hace 2 horas',
    )
  })
})
