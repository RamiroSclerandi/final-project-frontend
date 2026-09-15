import { describe, expect, it } from 'vitest'

import { toExportCsv } from './exportCsv'

describe('toExportCsv', () => {
  it('produces exactly N data rows plus a header, matching the queried series (REQ-DE-1)', () => {
    const csv = toExportCsv('sensor-1', [
      { t: '2026-09-15T10:00:00Z', value: 21.5, quality: 'ok' },
      {
        t: '2026-09-15T11:00:00Z',
        value: 22,
        quality: 'ok',
        tsSource: 'server',
      },
    ])

    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(
      'sensor_id,timestamp,value,quality,ts_source,value_min,value_max,sample_count',
    )
    expect(lines[1]).toBe('sensor-1,2026-09-15T10:00:00Z,21.5,ok,,,,')
    expect(lines[2]).toBe('sensor-1,2026-09-15T11:00:00Z,22,ok,server,,,')
  })

  it('carries aggregate fields (value_min, value_max, sample_count) for aggregate points', () => {
    const csv = toExportCsv('sensor-1', [
      {
        t: '2026-09-15T10:00:00Z',
        value: 21,
        min: 19,
        max: 23,
        sampleCount: 12,
      },
    ])

    expect(csv.split('\r\n')[1]).toBe(
      'sensor-1,2026-09-15T10:00:00Z,21,,,19,23,12',
    )
  })

  it('produces only the header for an empty series', () => {
    const csv = toExportCsv('sensor-1', [])

    expect(csv).toBe(
      'sensor_id,timestamp,value,quality,ts_source,value_min,value_max,sample_count',
    )
  })
})
