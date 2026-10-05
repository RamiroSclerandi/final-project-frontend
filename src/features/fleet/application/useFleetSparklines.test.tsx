import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFleetSparklines } from './useFleetSparklines'

const repositoryMocks = vi.hoisted(() => ({
  fetchRawMeasurements: vi.fn(),
}))

vi.mock(
  '../../telemetry-history/infrastructure/historyRepository',
  () => repositoryMocks,
)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  repositoryMocks.fetchRawMeasurements.mockReset().mockResolvedValue([])
})

describe('useFleetSparklines', () => {
  // The column is labelled "Last 60 min". A window frozen at mount would keep
  // that label while showing an hour that ended long ago, so the window has to
  // advance on its own for a dashboard left open on a wall screen.
  it('advances its window as time passes, so a long-lived view stops showing a stale hour', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      renderHook(() => useFleetSparklines(['sensor-1']), {
        wrapper: createWrapper(),
      })
      await waitFor(() =>
        expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledTimes(1),
      )
      const firstWindowEnd =
        repositoryMocks.fetchRawMeasurements.mock.calls[0]?.[2]

      await vi.advanceTimersByTimeAsync(61_000)

      await waitFor(() =>
        expect(
          repositoryMocks.fetchRawMeasurements.mock.calls.length,
        ).toBeGreaterThan(1),
      )
      const latestWindowEnd =
        repositoryMocks.fetchRawMeasurements.mock.calls.at(-1)?.[2]
      expect(latestWindowEnd).not.toBe(firstWindowEnd)
    } finally {
      vi.useRealTimers()
    }
  })

  it('issues exactly one fetch per sensor id -- never a call per table row (D4)', async () => {
    renderHook(() => useFleetSparklines(['sensor-a', 'sensor-b']), {
      wrapper: createWrapper(),
    })

    await waitFor(() =>
      expect(repositoryMocks.fetchRawMeasurements).toHaveBeenCalledTimes(2),
    )
  })

  it('maps each sensor id to its own resolved sparkline values', async () => {
    repositoryMocks.fetchRawMeasurements.mockImplementation(
      (sensorId: string) =>
        Promise.resolve(
          sensorId === 'sensor-a'
            ? [{ value: 10 }, { value: 20 }]
            : [{ value: 5 }],
        ),
    )

    const { result } = renderHook(
      () => useFleetSparklines(['sensor-a', 'sensor-b']),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current['sensor-a']).toEqual([10, 20]))
    expect(result.current['sensor-b']).toEqual([5])
  })

  it('issues zero fetches and returns an empty record for an empty sensor list', () => {
    const { result } = renderHook(() => useFleetSparklines([]), {
      wrapper: createWrapper(),
    })

    expect(repositoryMocks.fetchRawMeasurements).not.toHaveBeenCalled()
    expect(result.current).toEqual({})
  })
})
