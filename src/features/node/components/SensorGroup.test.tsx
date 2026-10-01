import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { SensorChannelGroup } from '../domain/nodeReading'
import { SensorGroup } from './SensorGroup'

const FOUR_PHASE_GROUP: SensorChannelGroup = {
  channel: 'voltage',
  unit: 'V',
  phases: [
    {
      tag: 'l1',
      sensorId: 'v-l1',
      label: null,
      value: 220,
      quality: 'ok',
      timestamp: '2026-09-22T10:00:00Z',
    },
    {
      tag: 'l2',
      sensorId: 'v-l2',
      label: null,
      value: 221,
      quality: 'ok',
      timestamp: '2026-09-22T10:00:00Z',
    },
    {
      tag: 'l3',
      sensorId: 'v-l3',
      label: null,
      value: 219,
      quality: 'ok',
      timestamp: '2026-09-22T10:00:00Z',
    },
    {
      tag: 'total',
      sensorId: 'v-total',
      label: null,
      value: 660,
      quality: 'ok',
      timestamp: '2026-09-22T10:00:00Z',
    },
  ],
}

const SINGLE_UNLABELED_GROUP: SensorChannelGroup = {
  channel: 'humidity',
  unit: '%',
  phases: [
    {
      tag: '',
      sensorId: 'humidity-1',
      label: null,
      value: 55.5,
      quality: 'ok',
      timestamp: '2026-09-22T10:00:00Z',
    },
  ],
}

describe('SensorGroup', () => {
  it('renders L1/L2/L3/Total column headers in that order (REQ-NODE-2)', () => {
    renderWithProviders(
      <SensorGroup group={FOUR_PHASE_GROUP} nodeId="device-1" />,
    )

    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual(['L1', 'L2', 'L3', 'Total'])
  })

  it('renders one unlabeled column header for a single empty-tag phase (REQ-NODE-3)', () => {
    renderWithProviders(
      <SensorGroup group={SINGLE_UNLABELED_GROUP} nodeId="device-1" />,
    )

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(1)
    // An empty tag must not become an empty header -- the point of the
    // requirement is a column a reader can name, not a blank one.
    expect(headers[0]).toHaveTextContent(/\S/)
  })

  it('labels every cell with its column header', () => {
    renderWithProviders(
      <SensorGroup group={FOUR_PHASE_GROUP} nodeId="device-1" />,
    )

    const headerTexts = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    const cellLabels = screen
      .getAllByRole('cell')
      .map((cell) => cell.getAttribute('data-label'))
    expect(cellLabels).toEqual(headerTexts)
  })

  it('links each phase cell to its sensor detail route', () => {
    renderWithProviders(
      <SensorGroup group={FOUR_PHASE_GROUP} nodeId="device-1" />,
    )

    expect(screen.getByRole('link', { name: /220/ })).toHaveAttribute(
      'href',
      '/nodes/device-1/sensors/v-l1',
    )
  })

  // Debt fix: the caption used to render the raw snake_case sensor_types.name
  // (e.g. "active_energy") straight from the backend instead of a translated
  // label.
  it('renders the translated channel label in the caption, not the raw channel name', () => {
    renderWithProviders(
      <SensorGroup
        group={{ ...FOUR_PHASE_GROUP, channel: 'active_energy', unit: 'kWh' }}
        nodeId="device-1"
      />,
    )

    expect(screen.getByText('Active energy · kWh')).toBeInTheDocument()
    expect(screen.queryByText(/active_energy/)).toBeNull()
  })

  it('falls back to the raw channel name for an unseeded channel instead of crashing', () => {
    renderWithProviders(
      <SensorGroup
        group={{ ...FOUR_PHASE_GROUP, channel: 'future_channel', unit: 'x' }}
        nodeId="device-1"
      />,
    )

    expect(screen.getByText('future_channel · x')).toBeInTheDocument()
  })

  // Debt fix: `in` matches inherited Object.prototype keys, so a tag of
  // literally "constructor" used to resolve to Object's constructor function
  // instead of falling back to the sensor's own label -- Object.hasOwn is the
  // correct own-property check.
  it('does not treat an inherited Object.prototype key as a named phase tag', () => {
    const groupWithPrototypeTag: SensorChannelGroup = {
      channel: 'voltage',
      unit: 'V',
      phases: [
        {
          tag: 'constructor',
          sensorId: 'weird-1',
          label: 'Weird sensor',
          value: 1,
          quality: 'ok',
          timestamp: '2026-09-22T10:00:00Z',
        },
      ],
    }

    renderWithProviders(
      <SensorGroup group={groupWithPrototypeTag} nodeId="device-1" />,
    )

    expect(screen.getByRole('columnheader')).toHaveTextContent('Weird sensor')
  })
})
