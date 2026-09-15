import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HistoryTitle } from './HistoryTitle'

describe('HistoryTitle', () => {
  it('shows the device name and sensor label', () => {
    render(
      <HistoryTitle
        reading={{
          deviceName: 'Node A',
          sensorLabel: 'Greenhouse',
          channel: 'temperature',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /node a.*greenhouse/i }),
    ).toBeInTheDocument()
  })

  it('falls back to the channel when there is no sensor label', () => {
    render(
      <HistoryTitle
        reading={{
          deviceName: 'Node A',
          sensorLabel: null,
          channel: 'temperature',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /node a.*temperature/i }),
    ).toBeInTheDocument()
  })

  it('shows a neutral title while the reading is not yet known', () => {
    render(<HistoryTitle reading={undefined} />)

    expect(screen.getByRole('heading')).toHaveTextContent(/sensor history/i)
  })
})
