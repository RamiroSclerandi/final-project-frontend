import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { DeviceConfigSummary } from '../domain/deviceConfig'
import { SamplingIntervalList } from './SamplingIntervalList'

const summary: DeviceConfigSummary = {
  deviceId: 'device-1',
  deviceName: 'Kitchen node',
  config: null,
}

describe('SamplingIntervalList', () => {
  it('shows a message when there are no devices yet', () => {
    render(
      <SamplingIntervalList
        summaries={[]}
        onApply={vi.fn()}
        savingDeviceId={null}
        errorDeviceId={null}
        errorMessage={null}
      />,
    )

    expect(screen.getByText(/no devices/i)).toBeInTheDocument()
  })

  it('renders one control per device', () => {
    render(
      <SamplingIntervalList
        summaries={[summary]}
        onApply={vi.fn()}
        savingDeviceId={null}
        errorDeviceId={null}
        errorMessage={null}
      />,
    )

    expect(screen.getByText('Kitchen node')).toBeInTheDocument()
  })
})
