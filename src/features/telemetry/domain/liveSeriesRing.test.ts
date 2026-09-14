import { describe, expect, it } from 'vitest'

import { appendLiveSeriesPoint, LIVE_SERIES_CAP } from './liveSeriesRing'

describe('appendLiveSeriesPoint', () => {
  it('appends a point to the routed sensor series', () => {
    const result = appendLiveSeriesPoint(
      {},
      { sensorId: 'sensor-a', value: 5, timestamp: 't1', quality: 'ok' },
    )

    expect(result['sensor-a']).toEqual([{ timestamp: 't1', value: 5 }])
  })

  it('drops the oldest point once the series exceeds the cap', () => {
    const cap = 3
    const seeded = {
      'sensor-a': [
        { timestamp: 't1', value: 1 },
        { timestamp: 't2', value: 2 },
        { timestamp: 't3', value: 3 },
      ],
    }

    const result = appendLiveSeriesPoint(
      seeded,
      { sensorId: 'sensor-a', value: 4, timestamp: 't4', quality: 'ok' },
      cap,
    )

    expect(result['sensor-a']).toEqual([
      { timestamp: 't2', value: 2 },
      { timestamp: 't3', value: 3 },
      { timestamp: 't4', value: 4 },
    ])
  })

  it('exports LIVE_SERIES_CAP as the default cap (design estimate, D-2)', () => {
    expect(LIVE_SERIES_CAP).toBe(2000)
  })
})
