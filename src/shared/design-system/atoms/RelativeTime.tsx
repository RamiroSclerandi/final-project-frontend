import { useTranslation } from '../../i18n/useTranslation'
import { useNow } from '../../time/useNow'

export interface RelativeTimeProps {
  iso: string
  nowMs?: number
}

/**
 * Renders a semantic `<time>` element with the raw ISO timestamp in
 * `dateTime` and a locale-formatted relative label as its visible text.
 * Without `nowMs` it follows the shared app clock. A timestamp ahead of the
 * local clock (device or server skew) reads as "now".
 */
export function RelativeTime({ iso, nowMs }: RelativeTimeProps) {
  const sharedNowMs = useNow()
  const { formatRelativeTime } = useTranslation()
  const referenceMs = Math.max(nowMs ?? sharedNowMs, Date.parse(iso))

  return <time dateTime={iso}>{formatRelativeTime(iso, referenceMs)}</time>
}
