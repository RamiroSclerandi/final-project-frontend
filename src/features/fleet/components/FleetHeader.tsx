import { KpiStat } from '../../../shared/design-system/molecules/KpiStat'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { ConnectionStatusBadge } from '../../telemetry/components/ConnectionStatusBadge'
import type { RealtimeStatus } from '../../telemetry/domain/connectionStatus'
import type { FleetSummary } from '../domain/fleetNode'

export interface FleetHeaderProps {
  summary: FleetSummary
  connectionStatus: RealtimeStatus
}

/**
 * Fleet KPI row (REQ-FLEET-1) plus the realtime connection indicator. The
 * quality-alerts KPI is explicitly labelled as a data-quality proxy, never
 * bare "alerts" (REQ-FLEET-2) -- it is not the reserved `/alerts` feature.
 */
export function FleetHeader({ summary, connectionStatus }: FleetHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-text">
            {t('fleet.title')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('fleet.kpi.nodes', { count: summary.total })}
          </p>
        </div>
        <ConnectionStatusBadge status={connectionStatus} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiStat label={t('fleet.kpi.online')} value={summary.online} />
        <KpiStat label={t('fleet.kpi.offline')} value={summary.offline} />
        <KpiStat label={t('status.unknown')} value={summary.unknown} />
        <KpiStat
          label={t('fleet.kpi.qualityAlerts')}
          value={summary.qualityAlerts}
        />
      </div>
    </header>
  )
}
