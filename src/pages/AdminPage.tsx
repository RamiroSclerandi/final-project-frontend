import { ReservedPage } from '../shared/design-system/templates/ReservedPage'
import { useTranslation } from '../shared/i18n/useTranslation'

/** Full admin tabs (Unassigned/Clients/Users) land in PR-9; a thin placeholder for now. */
export function AdminPage() {
  const { t } = useTranslation()

  return (
    <ReservedPage
      title={t('reserved.admin.title')}
      description={t('reserved.admin.description')}
    />
  )
}
