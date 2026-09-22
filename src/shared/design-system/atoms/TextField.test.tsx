import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { TextField } from './TextField'

describe('TextField', () => {
  it('associates a real label and reports typed input back to the caller', () => {
    function Harness() {
      const [value, setValue] = useState('')
      return (
        <TextField
          id="name"
          label="Node name"
          value={value}
          onChange={setValue}
        />
      )
    }
    render(<Harness />)

    const input = screen.getByLabelText('Node name')
    fireEvent.change(input, { target: { value: 'Pump 3' } })

    expect(input).toHaveValue('Pump 3')
  })

  it('forwards required and name so native form validation still applies', () => {
    render(
      <TextField
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        name="email"
        required
      />,
    )

    const input = screen.getByLabelText('Email')
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('name', 'email')
  })

  it('exposes the error text as an alert tied to the input', () => {
    render(
      <TextField
        id="name"
        label="Node name"
        value=""
        onChange={() => {}}
        error="Name is required"
      />,
    )

    const input = screen.getByLabelText('Node name')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Name is required')
    expect(input).toHaveAttribute('aria-describedby', alert.id)
  })
})
