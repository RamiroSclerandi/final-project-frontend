import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './useTheme'

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme}
    </button>
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.restoreAllMocks()
})

describe('ThemeProvider', () => {
  it('defaults to the dark theme when storage is empty', () => {
    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    )

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('initializes from a theme persisted under ui.theme.v1', () => {
    localStorage.setItem('ui.theme.v1', 'light')

    render(
      <ThemeProvider>
        <div />
      </ThemeProvider>,
    )

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('persists a theme change under ui.theme.v1', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <ThemeSwitcher />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'dark' }))

    expect(localStorage.getItem('ui.theme.v1')).toBe('light')
  })

  it('still renders with the dark theme and updates it when storage access is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() =>
      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>,
      ),
    ).not.toThrow()

    expect(document.documentElement.dataset.theme).toBe('dark')

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'dark' })),
    ).not.toThrow()

    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
