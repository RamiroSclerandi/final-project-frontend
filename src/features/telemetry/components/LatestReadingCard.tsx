import type { LatestReading } from '../domain/reading'

const QUALITY_LABELS: Record<'out_of_range' | 'suspect', string> = {
  out_of_range: 'Out of range',
  suspect: 'Suspect reading',
}

export interface LatestReadingCardProps {
  reading: LatestReading
}

/** One sensor's latest value (D-7: a non-ok quality is marked, never hidden). */
export function LatestReadingCard({ reading }: LatestReadingCardProps) {
  return (
    <article className="flex flex-col gap-1 rounded border border-slate-800 bg-slate-900 p-4">
      <h3 className="text-sm text-slate-400">{reading.deviceName}</h3>
      <p className="text-2xl font-semibold text-slate-100">
        {reading.value}{' '}
        <span className="text-base text-slate-400">{reading.unit}</span>
      </p>
      <p className="text-xs text-slate-500">
        {reading.sensorLabel ?? reading.channel}
      </p>
      {reading.quality !== 'ok' && (
        <p role="status" className="text-xs text-amber-400">
          {QUALITY_LABELS[reading.quality]}
        </p>
      )}
    </article>
  )
}
