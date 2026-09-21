import { createContext } from 'react'

import type { Locale, TranslationKey } from './dictionary'

type TranslationParams = Record<string, string | number>

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
  formatNumber: (value: number, maximumFractionDigits?: number) => string
  formatDateTime: (iso: string) => string
  formatRelativeTime: (iso: string, nowMs: number) => string
}

export const I18nContext = createContext<I18nContextValue | undefined>(
  undefined,
)
