import { useEffect, useState, type ReactNode } from 'react'

import { readStorageItem, writeStorageItem } from '../../lib/storage'
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  ThemeContext,
  type Theme,
} from './ThemeContext'

function readInitialTheme(initialTheme?: Theme): Theme {
  if (initialTheme) {
    return initialTheme
  }
  const stored = readStorageItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : DEFAULT_THEME
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
    writeStorageItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
