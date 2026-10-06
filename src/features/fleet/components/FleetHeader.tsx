import { KpiStat } from '../../../shared/design-system/molecules/KpiStat'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { ConnectionStatusBadge } from '../../telemetry/components/ConnectionStatusBadge'
import type { RealtimeStatus } from '../../telemetry/domain/connectionStatus'
import type { FleetSummary } from '../domain/fleetNode'

export interface FleetHeaderProps {
  summary: FleetSummary
  connectionStatus: RealtimeStatus
}

/** Decorative status glyph; the adjacent label carries the meaning. */
function StatDot({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      className={`h-2 w-2 ${className}`}
    >
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  )
}

/** Decorative triangle for the data-quality stat, so it never reads as plain status. */
function QualityGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" className="h-2 w-2 text-warning">
      <path d="M4 0.5 7.5 7.5H0.5Z" fill="currentColor" />
    </svg>
  )
}

const STAT_DIVIDER = 'md:border-l md:border-border md:pl-4'

/**
 * Fleet summary line (REQ-FLEET-1) plus the realtime connection indicator.
 * The quality-alerts stat is explicitly labelled as a data-quality proxy,
 * never bare "alerts" (REQ-FLEET-2) -- it is not the reserved `/alerts`
 * feature.
 */
export function FleetHeader({ summary, connectionStatus }: FleetHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-border pb-3 md:flex md:flex-wrap">
      <h1 className="text-lg font-semibold text-text">{t('fleet.title')}</h1>
      <p className="col-span-2 font-mono text-sm tabular-nums text-text-muted md:col-auto">
        {t('fleet.kpi.nodes', { count: summary.total })}
      </p>
      <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-2 md:col-auto md:flex md:flex-wrap md:items-center md:gap-y-1">
        <div className={STAT_DIVIDER}>
          <KpiStat
            label={t('fleet.kpi.online')}
            value={summary.online}
            indicator={<StatDot className="text-status-online" />}
          />
        </div>
        <div className={STAT_DIVIDER}>
          <KpiStat
            label={t('fleet.kpi.offline')}
            value={summary.offline}
            indicator={<StatDot className="text-status-offline" />}
          />
        </div>
        <div className={STAT_DIVIDER}>
          <KpiStat
            label={t('status.unknown')}
            value={summary.unknown}
            indicator={<StatDot className="text-status-unknown" />}
          />
        </div>
        <div className={STAT_DIVIDER}>
          <KpiStat
            label={t('fleet.kpi.qualityAlerts')}
            value={summary.qualityAlerts}
            indicator={<QualityGlyph />}
          />
        </div>
      </div>
      <div className="col-start-2 row-start-1 md:ml-auto">
        <ConnectionStatusBadge status={connectionStatus} />
      </div>
    </header>
  )
}
