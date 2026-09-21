import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('defaults to type="button" and runs its click handler', () => {
    function Harness() {
      const [count, setCount] = useState(0)
      return (
        <Button variant="primary" onClick={() => setCount((c) => c + 1)}>
          Clicked {count} times
        </Button>
      )
    }
    render(<Harness />)

    const button = screen.getByRole('button', { name: 'Clicked 0 times' })
    expect(button).toHaveAttribute('type', 'button')

    fireEvent.click(button)

    expect(
      screen.getByRole('button', { name: 'Clicked 1 times' }),
    ).toBeInTheDocument()
  })

  it('honors an explicit type and the disabled state', () => {
    render(
      <Button variant="danger" type="submit" disabled>
        Delete
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toBeDisabled()
  })
})
