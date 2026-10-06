import { QualityMark } from '../../../shared/design-system/atoms/QualityMark'
import { useTranslation } from '../../../shared/i18n/useTranslation'

/**
 * Chart key (REQ-SENSOR-3): line and min/max band swatches, then the three
 * quality marks. Out-of-range and suspect are distinct fill colors, provisional
 * is a dotted outline, never a color alone -- each mark pairs a glyph with its
 * own visible text label (reuses the `quality.*` keys first consumed by
 * `SensorGroup`, PR-6).
 */
export function ChartLegend() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="h-0.5 w-4 bg-accent" />
        {t('chart.legend.value')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-4 bg-accent/16" />
        {t('chart.legend.range')}
      </span>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        <li data-quality="out_of_range">
          <QualityMark quality="out_of_range" label={t('quality.outOfRange')} />
        </li>
        <li data-quality="suspect">
          <QualityMark quality="suspect" label={t('quality.suspect')} />
        </li>
        <li data-quality="provisional">
          <QualityMark quality="provisional" label={t('quality.provisional')} />
        </li>
      </ul>
    </div>
  )
}
