import { describe, expect, it } from 'vitest'

import { toPolylinePoints } from './toPolylinePoints'

describe('toPolylinePoints', () => {
  it('returns an empty string for an empty series', () => {
    expect(toPolylinePoints([])).toBe('')
  })

  it('normalizes a rising series into the 100x24 viewBox, high value near the top', () => {
    const points = toPolylinePoints([0, 5, 10])

    expect(points).toBe('0.00,24.00 50.00,12.00 100.00,0.00')
  })

  it('centers a flat series vertically since range collapses to 1', () => {
    expect(toPolylinePoints([7, 7])).toBe('0.00,12.00 100.00,12.00')
  })

  // PR-2 debt: a single-point series was never asserted; must not produce NaN.
  it('renders a single point as a horizontal centered line, never NaN', () => {
    const points = toPolylinePoints([42])

    expect(points).toBe('0.00,12.00 100.00,12.00')
    expect(points).not.toMatch(/NaN/)
  })
})
