import { ReservedPage } from '../shared/design-system/templates/ReservedPage'
import { useTranslation } from '../shared/i18n/useTranslation'

/** Alerting is a reserved feature (REQ-FLEET-2); this route is a placeholder for now. */
export function AlertsPage() {
  const { t } = useTranslation()

  return (
    <ReservedPage
      title={t('reserved.alerts.title')}
      description={t('reserved.alerts.description')}
    />
  )
}
