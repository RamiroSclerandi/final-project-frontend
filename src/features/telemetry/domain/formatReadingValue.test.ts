import { describe, expect, it } from 'vitest'

import { formatReadingValue } from './formatReadingValue'

describe('formatReadingValue', () => {
  it('rounds a long float to 2 decimals', () => {
    expect(formatReadingValue(19.0104893726047)).toBe('19.01')
  })

  it('pads a whole number to 2 decimals', () => {
    expect(formatReadingValue(20)).toBe('20.00')
  })

  it('keeps a negative value signed', () => {
    expect(formatReadingValue(-4.5)).toBe('-4.50')
  })

  it('rounds up when the third decimal is 5 or above', () => {
    expect(formatReadingValue(1.006)).toBe('1.01')
  })
})
