import { Link } from 'react-router-dom'

import { QualityMark } from '../../../shared/design-system/atoms/QualityMark'
import type { TranslationKey } from '../../../shared/i18n/dictionary'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { unitLabel } from '../../../shared/lib/unitLabel'

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
  const { t, formatNumber } = useTranslation()
  const label = reading
    ? (reading.sensorLabel ?? reading.channel)
    : t('sensor.header.unknownLabel')

  return (
    <header className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <nav
        aria-label={t('sensor.breadcrumb.label')}
        className="text-xs text-text-muted"
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-lg font-semibold text-text">{label}</h1>
        {reading && (
          <div className="flex flex-col gap-1">
            <span className="text-2xs font-medium tracking-label text-text-muted uppercase">
              {t('sensor.header.currentValue')}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xl tabular-nums text-text">
                {formatNumber(reading.value)}
                {unitLabel(reading.unit) && (
                  <span className="ml-1 text-sm text-text-muted">
                    {unitLabel(reading.unit)}
                  </span>
                )}
              </span>
              <span className="text-sm text-text">
                <QualityMark
                  quality={reading.quality}
                  label={t(QUALITY_LABEL_KEYS[reading.quality])}
                />
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
