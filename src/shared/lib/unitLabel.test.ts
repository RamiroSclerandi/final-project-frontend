import { describe, expect, it } from 'vitest'

import { unitLabel } from './unitLabel'

describe('unitLabel', () => {
  it.each([
    ['degC', '°C'],
    ['pct', '%'],
    ['hPa', 'hPa'],
    ['none', ''],
    ['V', 'V'],
  ])('displays %s as "%s"', (unit, label) => {
    expect(unitLabel(unit)).toBe(label)
  })
})
