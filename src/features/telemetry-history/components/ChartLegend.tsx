import { QualityMark } from '../../../shared/design-system/atoms/QualityMark'
import { useTranslation } from '../../../shared/i18n/useTranslation'

/**
 * Static three-item quality legend (REQ-SENSOR-3): out-of-range and suspect
 * are distinct fill colors, provisional is a dotted outline, never a color
 * alone -- each mark pairs a visual glyph with its own visible text label
 * (reuses the `quality.*` keys first consumed by `SensorGroup`, PR-6).
 */
export function ChartLegend() {
  const { t } = useTranslation()

  return (
    <ul className="flex flex-wrap gap-4">
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
  )
}
