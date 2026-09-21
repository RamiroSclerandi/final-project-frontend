import { useState } from 'react'

import { useTranslation } from '../../i18n/useTranslation'

export interface RelativeTimeProps {
  iso: string
  nowMs?: number
}

/**
 * Renders a semantic `<time>` element with the raw ISO timestamp in
 * `dateTime` and a locale-formatted relative label as its visible text.
 * Not a translated-text atom -- it never calls `t()`, only the relative-time
 * formatter from `useTranslation()`.
 *
 * `Date.now()` is impure and cannot be called directly during render
 * (react-hooks/purity); a lazy `useState` initializer runs it exactly once,
 * on mount, as the fallback for callers that omit `nowMs`.
 */
export function RelativeTime({ iso, nowMs }: RelativeTimeProps) {
  const [mountedAtMs] = useState(() => Date.now())
  const { formatRelativeTime } = useTranslation()

  return (
    <time dateTime={iso}>{formatRelativeTime(iso, nowMs ?? mountedAtMs)}</time>
  )
}
