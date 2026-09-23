import { Link } from 'react-router-dom'

import { QualityMark } from '../../../shared/design-system/atoms/QualityMark'
import { Value } from '../../../shared/design-system/atoms/Value'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'

type ReadingQuality = 'ok' | 'out_of_range' | 'suspect'

export interface SensorHeaderReading {
  deviceName: string
  sensorLabel: string | null
  channel: string
  unit: string
  value: number
  quality: ReadingQuality
}

export interface SensorHeaderProps {
  deviceId: string
  reading?: SensorHeaderReading
}

const QUALITY_LABEL_KEYS = {
  ok: 'quality.ok',
  out_of_range: 'quality.outOfRange',
  suspect: 'quality.suspect',
} satisfies Record<ReadingQuality, TranslationKey>

/**
 * Breadcrumb (`Fleet › {device} › {sensor}`) and the sensor's latest value,
 * sourced from the already-fetched latest-readings cache -- same pattern as
 * the former `HistoryTitleContainer` (REMOVED, ui-redesign PR-8).
 */
export function SensorHeader({ deviceId, reading }: SensorHeaderProps) {
  const { t } = useTranslation()
  const label = reading
    ? (reading.sensorLabel ?? reading.channel)
    : t('sensor.header.unknownLabel')

  return (
    <header className="flex flex-col gap-2">
      <nav
        aria-label={t('sensor.breadcrumb.label')}
        className="text-sm text-text-muted"
      >
        <Link to="/" className="hover:text-text">
          {t('fleet.title')}
        </Link>
        {' › '}
        <Link to={`/nodes/${deviceId}`} className="hover:text-text">
          {reading?.deviceName ?? deviceId}
        </Link>
        {' › '}
        <span className="text-text">{label}</span>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-text">{label}</h1>
        {reading && (
          <>
            <Value value={reading.value} unit={reading.unit} />
            <QualityMark
              quality={reading.quality}
              label={t(QUALITY_LABEL_KEYS[reading.quality])}
            />
          </>
        )}
      </div>
    </header>
  )
}
