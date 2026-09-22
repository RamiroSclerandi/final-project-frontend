import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { LogoutButtonContainer } from './LogoutButtonContainer'

const signOutMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useAuth', () => ({
  useAuth: () => ({ signOut: signOutMock }),
}))

describe('LogoutButtonContainer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls useAuth().signOut when the button is clicked', () => {
    renderWithProviders(<LogoutButtonContainer />)

    fireEvent.click(screen.getByRole('button', { name: /log out/i }))

    expect(signOutMock).toHaveBeenCalledOnce()
  })
})
