import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_RAW_ROWS } from '../../telemetry-history/domain/rawRowLimit'
import { useCsvExport } from './useCsvExport'

const repositoryMocks = vi.hoisted(() => ({ fetchRawMeasurements: vi.fn() }))
const downloadMocks = vi.hoisted(() => ({ downloadCsv: vi.fn() }))

vi.mock(
  '../../telemetry-history/infrastructure/historyRepository',
  () => repositoryMocks,
)
vi.mock('../infrastructure/downloadCsv', () => downloadMocks)

beforeEach(() => {
  repositoryMocks.fetchRawMeasurements.mockReset()
  downloadMocks.downloadCsv.mockReset()
})

describe('useCsvExport', () => {
  it('fetches the raw range, serializes it, and triggers a download (REQ-DE-1)', async () => {
    repositoryMocks.fetchRawMeasurements.mockResolvedValue([
      { t: '2026-09-15T10:00:00Z', value: 21, quality: 'ok' },
    ])
    const { result } = renderHook(() => useCsvExport())

    await act(() =>
      result.current.exportRange(
        'sensor-1',
        '2026-09-14T10:00:00Z',
        '2026-09-15T10:00:00Z',
      ),
    )

    expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledWith(
      'sensor-1',
      '2026-09-14T10:00:00Z',
      '2026-09-15T10:00:00Z',
      { maxRows: MAX_RAW_ROWS },
    )
    expect(downloadMocks.downloadCsv).toHaveBeenCalledOnce()
    expect(downloadMocks.downloadCsv.mock.calls[0]?.[0]).toContain(
      'sensor-1,2026-09-15T10:00:00Z,21,ok',
    )
    expect(result.current.isExporting).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets a busy state while the export is in flight', async () => {
    let resolveFetch: (value: unknown[]) => void = () => {}
    repositoryMocks.fetchRawMeasurements.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    const { result } = renderHook(() => useCsvExport())

    act(() => {
      void result.current.exportRange('sensor-1', 'from', 'to')
    })

    await waitFor(() => expect(result.current.isExporting).toBe(true))

    await act(async () => {
      resolveFetch([])
      await Promise.resolve()
    })

    await waitFor(() => expect(result.current.isExporting).toBe(false))
  })

  it('reports a generic error message on failure, never the raw error', async () => {
    repositoryMocks.fetchRawMeasurements.mockRejectedValue(
      new Error('permission denied for relation measurements'),
    )
    const { result } = renderHook(() => useCsvExport())

    await act(() => result.current.exportRange('sensor-1', 'from', 'to'))

    expect(result.current.error).toBe(
      'Could not export the selected range. Try again.',
    )
    expect(result.current.error).not.toContain('permission denied')
  })
})
