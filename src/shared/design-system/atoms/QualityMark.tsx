export type Quality = 'ok' | 'out_of_range' | 'suspect' | 'provisional'

export interface QualityMarkProps {
  quality: Quality
  label: string
}

// Provisional/server-time-unsynced points are a dotted-border marker, never
// a fill color (proposal) -- it must stay visually distinct even for users
// who cannot perceive the ok/out-of-range/suspect color difference.
const QUALITY_GLYPH_CLASSES: Record<Quality, string> = {
  ok: 'bg-quality-ok',
  out_of_range: 'bg-quality-out-of-range',
  suspect: 'bg-quality-suspect',
  provisional: 'border-2 border-dashed border-text-muted bg-transparent',
}

/**
 * Reading-quality indicator: pairs a decorative glyph with visible text so
 * quality is never conveyed by color alone. `label` is already translated
 * by the caller -- this atom never calls `t()`.
 */
export function QualityMark({ quality, label }: QualityMarkProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 rounded-full ${QUALITY_GLYPH_CLASSES[quality]}`}
      />
      <span>{label}</span>
    </span>
  )
}
