import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LogoutButton } from './LogoutButton'

describe('LogoutButton', () => {
  it('calls onLogout when clicked', () => {
    const onLogout = vi.fn()

    render(<LogoutButton onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: /log out/i }))

    expect(onLogout).toHaveBeenCalledOnce()
  })
})
