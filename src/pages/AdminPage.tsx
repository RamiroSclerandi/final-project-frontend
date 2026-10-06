import { AdminContainer } from '../features/admin'
import { EmptyState } from '../shared/design-system/molecules/EmptyState'
import { Tabs } from '../shared/design-system/molecules/Tabs'
import { useTranslation } from '../shared/i18n/useTranslation'

const UNASSIGNED_TAB = 'unassigned'
const CLIENTS_TAB = 'clients'
const USERS_TAB = 'users'

/**
 * Admin route (`/admin`, ui-redesign PR-9): three tabs, but only Unassigned
 * devices has real data behind it (decision #411) -- there is no `clients`
 * or roles table yet, and multi-tenant RLS is a separate pending backend
 * change. Clients and Users render an inline placeholder and never query
 * anything (REQ-ADMIN-2). Replaces the PR-3 whole-page placeholder.
 *
 * The heading lives on the page rather than inside a panel: a tab panel is a
 * section of this route, so the route must name itself once regardless of
 * which tab is selected. That also rules out the `ReservedPage` template
 * here -- its own `h1` is a page title, which would make two tabs out of
 * three announce a second one at the wrong level.
 */
export function AdminPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-text">{t('admin.title')}</h1>
      <Tabs defaultValue={UNASSIGNED_TAB} label={t('admin.tabs.label')}>
        <Tabs.List>
          <Tabs.Item value={UNASSIGNED_TAB}>
            {t('admin.tabs.unassigned')}
          </Tabs.Item>
          <Tabs.Item value={CLIENTS_TAB}>{t('admin.tabs.clients')}</Tabs.Item>
          <Tabs.Item value={USERS_TAB}>{t('admin.tabs.users')}</Tabs.Item>
        </Tabs.List>
        <Tabs.Panel value={UNASSIGNED_TAB}>
          <AdminContainer />
        </Tabs.Panel>
        <Tabs.Panel value={CLIENTS_TAB}>
          <EmptyState
            title={t('reserved.adminClients.title')}
            body={t('reserved.adminClients.description')}
          />
        </Tabs.Panel>
        <Tabs.Panel value={USERS_TAB}>
          <EmptyState
            title={t('reserved.adminUsers.title')}
            body={t('reserved.adminUsers.description')}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
