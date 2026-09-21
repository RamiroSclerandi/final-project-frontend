import { use } from 'react'

import { ThemeContext } from './ThemeContext'

/** Reads the active theme and its setter. Must be called under `ThemeProvider`. */
export function useTheme() {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
