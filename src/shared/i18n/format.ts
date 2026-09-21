import type { Locale } from './dictionary'

/** Locale-aware number formatting for `Value` and other numeric displays. */
export function formatNumber(
  locale: Locale,
  value: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value)
}

/** Locale-aware date + time formatting for timestamps. */
export function formatDateTime(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000
const SECOND_MS = 1_000

/** Picks the largest whole unit (day/hour/minute/second) that fits `deltaMs`. */
function pickRelativeUnit(deltaMs: number): {
  unit: Intl.RelativeTimeFormatUnit
  ms: number
} {
  const absoluteMs = Math.abs(deltaMs)
  if (absoluteMs >= DAY_MS) {
    return { unit: 'day', ms: DAY_MS }
  }
  if (absoluteMs >= HOUR_MS) {
    return { unit: 'hour', ms: HOUR_MS }
  }
  if (absoluteMs >= MINUTE_MS) {
    return { unit: 'minute', ms: MINUTE_MS }
  }
  return { unit: 'second', ms: SECOND_MS }
}

/**
 * Formats `iso` relative to `nowMs` using the largest whole unit among
 * seconds/minutes/hours/days (`RelativeTime` atom, PR-2).
 */
export function formatRelativeTime(
  locale: Locale,
  iso: string,
  nowMs: number,
): string {
  const deltaMs = new Date(iso).getTime() - nowMs
  const { unit, ms } = pickRelativeUnit(deltaMs)

  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(deltaMs / ms),
    unit,
  )
}
