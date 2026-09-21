import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { readStorageItem, writeStorageItem } from '../lib/storage'
import type { Locale } from './dictionary'
import { en } from './dictionaries/en'
import { es } from './dictionaries/es'
import { formatDateTime, formatNumber, formatRelativeTime } from './format'
import { I18nContext, type I18nContextValue } from './I18nContext'
import { translate } from './translate'

const STORAGE_KEY = 'ui.locale.v1'
const dictionaries = { en, es }

function detectBrowserLocale(): Locale {
  return navigator.language.startsWith('es') ? 'es' : 'en'
}

function readInitialLocale(initialLocale?: Locale): Locale {
  if (initialLocale) {
    return initialLocale
  }
  const stored = readStorageItem(STORAGE_KEY)
  return stored === 'es' || stored === 'en' ? stored : detectBrowserLocale()
}

/**
 * Owns the active locale (REQ-I18N-4). Resolution order: `initialLocale`
 * prop → `ui.locale.v1` in storage → browser language. Reflects the locale
 * on `<html lang>` and persists it on every change.
 */
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale
  children: ReactNode
}) {
  const [locale, setLocale] = useState<Locale>(() =>
    readInitialLocale(initialLocale),
  )

  useEffect(() => {
    document.documentElement.lang = locale
    writeStorageItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale]
    return {
      locale,
      setLocale,
      t: (key, params) => translate(dictionary, locale, key, params),
      formatNumber: (value, maximumFractionDigits) =>
        formatNumber(locale, value, maximumFractionDigits),
      formatDateTime: (iso) => formatDateTime(locale, iso),
      formatRelativeTime: (iso, nowMs) =>
        formatRelativeTime(locale, iso, nowMs),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
