import { describe, expect, it } from 'vitest'

import { downsampleLTTB } from './downsample'
import type { HistoricalPoint } from './historicalPoint'

function point(index: number, value: number): HistoricalPoint {
  return {
    t: new Date(Date.UTC(2026, 8, 15) + index * 15_000).toISOString(),
    value,
    quality: 'ok',
  }
}

function series(
  length: number,
  valueAt: (index: number) => number = () => 0,
): HistoricalPoint[] {
  return Array.from({ length }, (_, index) => point(index, valueAt(index)))
}

describe('downsampleLTTB', () => {
  it('returns the same points unchanged when the series is below the threshold', () => {
    const points = series(10)

    expect(downsampleLTTB(points, 5000)).toEqual(points)
  })

  it('returns the same points unchanged when the series length equals the threshold', () => {
    const points = series(500)

    expect(downsampleLTTB(points, 500)).toEqual(points)
  })

  it('reduces a series above the threshold to exactly the threshold length (REQ-HS-4)', () => {
    const points = series(5760)

    expect(downsampleLTTB(points, 5000)).toHaveLength(5000)
  })

  it('always keeps the first and last point unchanged', () => {
    const points = series(5760, (index) => 20 + (index % 3))

    const result = downsampleLTTB(points, 5000)

    expect(result[0]).toEqual(points[0])
    expect(result.at(-1)).toEqual(points.at(-1))
  })

  it('keeps timestamps strictly increasing in the downsampled output', () => {
    const points = series(5760, (index) => 20 + (index % 3))

    const result = downsampleLTTB(points, 5000)

    const isStrictlyIncreasing = result.every((resultPoint, index) => {
      if (index === 0) {
        return true
      }
      const previous = result[index - 1]
      return (
        previous !== undefined &&
        Date.parse(resultPoint.t) > Date.parse(previous.t)
      )
    })
    expect(isStrictlyIncreasing).toBe(true)
  })

  it('returns only the first and last point when the threshold is below 3', () => {
    const points = series(10)

    expect(downsampleLTTB(points, 2)).toEqual([points[0], points[9]])
  })

  it('preserves a sharp spike inside an otherwise flat series', () => {
    const points = series(5760, () => 20)
    const spiked = points.map((existing, index) =>
      index === 3000 ? { ...existing, value: 999 } : existing,
    )

    const result = downsampleLTTB(spiked, 5000)

    expect(result.some((resultPoint) => resultPoint.value === 999)).toBe(true)
  })
})
