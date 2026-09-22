import { FleetContainer } from '../features/fleet'

/**
 * Fleet route (`/`): the redesigned dashboard entry point (ui-redesign PR-4),
 * replacing `DashboardPage`. Mounted as a child of the app shell -- its own
 * landmark, title, and logout button are the shell's job, not this page's.
 */
export function FleetPage() {
  return <FleetContainer />
}
