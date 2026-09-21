import { use } from 'react'

import { I18nContext } from './I18nContext'

/** Reads locale, `t()`, and the locale-aware formatters. Must be called under `I18nProvider`. */
export function useTranslation() {
  const context = use(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider')
  }
  return context
}
