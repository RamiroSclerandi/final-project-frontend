import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { SelectField } from './SelectField'

const OPTIONS = [
  { value: 'raw', label: 'Raw' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
]

describe('SelectField', () => {
  it('associates a real label and reports the selected option back to the caller', () => {
    function Harness() {
      const [value, setValue] = useState('raw')
      return (
        <SelectField
          id="granularity"
          label="Granularity"
          value={value}
          options={OPTIONS}
          onChange={setValue}
        />
      )
    }
    render(<Harness />)

    const select = screen.getByLabelText('Granularity')
    fireEvent.change(select, { target: { value: 'daily' } })

    expect(select).toHaveValue('daily')
  })

  it('renders every option label', () => {
    render(
      <SelectField
        id="granularity"
        label="Granularity"
        value="raw"
        options={OPTIONS}
        onChange={() => {}}
      />,
    )

    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'Daily' })).toBeInTheDocument()
  })
})
