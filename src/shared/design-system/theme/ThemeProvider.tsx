import { useEffect, useState, type ReactNode } from 'react'

import { readStorageItem, writeStorageItem } from '../../lib/storage'
import { ThemeContext, type Theme } from './ThemeContext'

const STORAGE_KEY = 'ui.theme.v1'

function readInitialTheme(initialTheme?: Theme): Theme {
  if (initialTheme) {
    return initialTheme
  }
  const stored = readStorageItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'dark'
}

/**
 * Owns the active theme (REQ-DT-2). Defaults to dark, persists the choice
 * under `ui.theme.v1`, and reflects it on `<html data-theme>` so `@theme
 * inline` tokens and the `dark:` custom variant resolve consistently.
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme?: Theme
  children: ReactNode
}) {
  const [theme, setTheme] = useState<Theme>(() =>
    readInitialTheme(initialTheme),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    writeStorageItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
