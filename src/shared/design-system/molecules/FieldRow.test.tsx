import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FieldRow } from './FieldRow'

describe('FieldRow', () => {
  it('renders the label alongside its control', () => {
    render(
      <FieldRow label="Transport">
        <span>MQTT</span>
      </FieldRow>,
    )

    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('MQTT')).toBeInTheDocument()
  })

  it('renders a different label and control', () => {
    render(
      <FieldRow label="Firmware">
        <span>v2.3.1</span>
      </FieldRow>,
    )

    expect(screen.getByText('Firmware')).toBeInTheDocument()
    expect(screen.getByText('v2.3.1')).toBeInTheDocument()
  })
})
