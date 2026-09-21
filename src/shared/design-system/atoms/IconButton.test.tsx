import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('exposes the accessible name from the label prop and hides its icon child', () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <IconButton label="Dismiss" onClick={() => setOpen(true)}>
            <span>x</span>
          </IconButton>
          {open ? <p>Dismissed</p> : null}
        </>
      )
    }
    render(<Harness />)

    const button = screen.getByRole('button', { name: 'Dismiss' })
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull()

    fireEvent.click(button)

    expect(screen.getByText('Dismissed')).toBeInTheDocument()
  })

  it('exposes a different accessible name for a different label', () => {
    render(<IconButton label="Configure">gear</IconButton>)

    expect(
      screen.getByRole('button', { name: 'Configure' }),
    ).toBeInTheDocument()
  })
})
