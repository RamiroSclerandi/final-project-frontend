import { NodeHealthContainer } from '../features/node-health'
import { LiveDashboardContainer } from '../features/telemetry'

/**
 * Dashboard route: live per-sensor values over the realtime channel (D-2),
 * plus per-node online/offline (CA-6). Mounted as a child of the app shell
 * (ui-redesign PR-3): its own `<main>` landmark, title, and logout button
 * are gone since the shell now owns all three (design's PR-3 risk note).
 * Replaced by `FleetPage` in PR-4.
 */
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <NodeHealthContainer />
      <LiveDashboardContainer />
    </div>
  )
}
