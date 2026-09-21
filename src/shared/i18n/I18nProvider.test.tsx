import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from './I18nProvider'
import { useTranslation } from './useTranslation'

function LocaleSwitcher() {
  const { locale, setLocale } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
    >
      {locale}
    </button>
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
  vi.restoreAllMocks()
})

describe('I18nProvider', () => {
  it('sets <html lang> and persists the locale when switching to es', () => {
    render(
      <I18nProvider initialLocale="en">
        <LocaleSwitcher />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'en' }))

    expect(document.documentElement.lang).toBe('es')
    expect(localStorage.getItem('ui.locale.v1')).toBe('es')
  })

  it('initializes from a locale persisted under ui.locale.v1', () => {
    localStorage.setItem('ui.locale.v1', 'es')

    render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'es' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')
  })

  it('still renders with a lang attribute and updates it when storage access is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() =>
      render(
        <I18nProvider initialLocale="en">
          <LocaleSwitcher />
        </I18nProvider>,
      ),
    ).not.toThrow()

    expect(document.documentElement.lang).toBe('en')

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: 'en' })),
    ).not.toThrow()

    expect(document.documentElement.lang).toBe('es')
  })
})
