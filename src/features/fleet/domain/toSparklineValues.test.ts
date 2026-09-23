import { describe, expect, it } from 'vitest'

import { toSparklineValues } from './toSparklineValues'

describe('toSparklineValues', () => {
  it('extracts the value field from each point, in order', () => {
    expect(
      toSparklineValues([{ value: 10 }, { value: 12.5 }, { value: 9 }]),
    ).toEqual([10, 12.5, 9])
  })

  it('returns an empty array for an empty series', () => {
    expect(toSparklineValues([])).toEqual([])
  })
})
