import { createContext } from 'react'

export type Theme = 'dark' | 'light'

/**
 * Shared with the bootstrap script in `index.html`, which applies the stored
 * theme before the bundle loads. A contract test keeps both copies in step.
 */
export const THEME_STORAGE_KEY = 'ui.theme.v1'

/** Monitoring dashboards are read in the dark far more often than in daylight. */
export const DEFAULT_THEME: Theme = 'dark'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)
