import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RemoteConfigContainer } from './RemoteConfigContainer'

// Fakes the invoke boundary at infrastructure, not at the application hooks,
// so the real useDeviceConfigs/useSetSamplingInterval wiring (cache read,
// mutate, invalidate-on-success) runs for real in this test.
const repositoryMocks = vi.hoisted(() => ({
  fetchDeviceConfigSummaries: vi.fn(),
  setSamplingInterval: vi.fn(),
}))
vi.mock('../infrastructure/remoteConfigRepository', () => repositoryMocks)

function renderWithClient() {
  const queryClient = new QueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  return render(<RemoteConfigContainer />, { wrapper: Wrapper })
}

beforeEach(() => {
  repositoryMocks.fetchDeviceConfigSummaries.mockReset()
  repositoryMocks.setSamplingInterval.mockReset()
})

describe('RemoteConfigContainer', () => {
  it('renders the fetched devices with their requested state', async () => {
    repositoryMocks.fetchDeviceConfigSummaries.mockResolvedValue([
      {
        deviceId: 'device-1',
        deviceName: 'Kitchen node',
        config: {
          samplingIntervalMs: 60000,
          requestedAt: '2026-09-15T12:00:00Z',
        },
      },
    ])

    renderWithClient()

    expect(
      await screen.findByText(/requested 60s at 2026-09-15T12:00:00Z/i),
    ).toBeInTheDocument()
  })

  it('calls setSamplingInterval with the deviceId and the interval in ms, and refetches on success', async () => {
    repositoryMocks.fetchDeviceConfigSummaries
      .mockResolvedValueOnce([
        { deviceId: 'device-1', deviceName: 'Kitchen node', config: null },
      ])
      .mockResolvedValueOnce([
        {
          deviceId: 'device-1',
          deviceName: 'Kitchen node',
          config: {
            samplingIntervalMs: 45000,
            requestedAt: '2026-09-15T13:00:00Z',
          },
        },
      ])
    repositoryMocks.setSamplingInterval.mockResolvedValue(undefined)

    renderWithClient()
    await screen.findByText(/not configured/i)

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '45' },
    })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() =>
      expect(repositoryMocks.setSamplingInterval).toHaveBeenCalledWith(
        'device-1',
        45000,
      ),
    )
    expect(
      await screen.findByText(/requested 45s at 2026-09-15T13:00:00Z/i),
    ).toBeInTheDocument()
  })

  it('shows a safe message for the device whose request failed (502)', async () => {
    repositoryMocks.fetchDeviceConfigSummaries.mockResolvedValue([
      { deviceId: 'device-1', deviceName: 'Kitchen node', config: null },
    ])
    const { SamplingIntervalRequestError } =
      await import('../domain/setIntervalError')
    repositoryMocks.setSamplingInterval.mockRejectedValue(
      new SamplingIntervalRequestError(502),
    )

    renderWithClient()
    await screen.findByText(/not configured/i)

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '45' },
    })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/broker.*recorded/i),
    )
  })
})
