import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { SamplingIntervalContainer } from './SamplingIntervalContainer'

// Fakes the invoke boundary at infrastructure, not at the application hooks,
// so the real useDeviceConfigs/useSetSamplingInterval wiring (cache read,
// mutate, invalidate-on-success) runs for real in this test.
const repositoryMocks = vi.hoisted(() => ({
  fetchDeviceConfigSummaries: vi.fn(),
  setSamplingInterval: vi.fn(),
}))
vi.mock('../infrastructure/remoteConfigRepository', () => repositoryMocks)

beforeEach(() => {
  repositoryMocks.fetchDeviceConfigSummaries.mockReset()
  repositoryMocks.setSamplingInterval.mockReset()
})

describe('SamplingIntervalContainer', () => {
  it('renders the requested sampling interval for the given device', async () => {
    repositoryMocks.fetchDeviceConfigSummaries.mockResolvedValue([
      {
        deviceId: 'device-1',
        deviceName: 'Kitchen node',
        config: {
          samplingIntervalMs: 60000,
          requestedAt: new Date().toISOString(),
        },
      },
    ])

    renderWithProviders(<SamplingIntervalContainer deviceId="device-1" />)

    expect(await screen.findByText(/^Requested 60 s ·/)).toBeInTheDocument()
  })

  it('renders nothing for a deviceId with no config-summary row', async () => {
    repositoryMocks.fetchDeviceConfigSummaries.mockResolvedValue([])

    const { container } = renderWithProviders(
      <SamplingIntervalContainer deviceId="device-unknown" />,
    )

    await waitFor(() => expect(container).toBeEmptyDOMElement())
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
            requestedAt: new Date().toISOString(),
          },
        },
      ])
    repositoryMocks.setSamplingInterval.mockResolvedValue(undefined)

    renderWithProviders(<SamplingIntervalContainer deviceId="device-1" />)
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
    expect(await screen.findByText(/^Requested 45 s ·/)).toBeInTheDocument()
  })

  it('says a 502 was saved but not delivered, shows the saved request, and keeps the message until dismissed (REQ-RC-12)', async () => {
    repositoryMocks.fetchDeviceConfigSummaries
      .mockResolvedValueOnce([
        { deviceId: 'device-1', deviceName: 'Kitchen node', config: null },
      ])
      .mockResolvedValue([
        {
          deviceId: 'device-1',
          deviceName: 'Kitchen node',
          config: {
            samplingIntervalMs: 45_000,
            requestedAt: new Date().toISOString(),
          },
        },
      ])
    const { SamplingIntervalRequestError } =
      await import('../domain/setIntervalError')
    repositoryMocks.setSamplingInterval.mockRejectedValue(
      new SamplingIntervalRequestError(502),
    )

    renderWithProviders(<SamplingIntervalContainer deviceId="device-1" />)
    await screen.findByText(/not configured/i)

    fireEvent.change(screen.getByLabelText(/sampling interval/i), {
      target: { value: '45' },
    })
    fireEvent.click(screen.getByRole('button', { name: /apply/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /saved.*not notified/i,
      ),
    )
    expect(await screen.findByText(/requested 45 s/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  })
})
