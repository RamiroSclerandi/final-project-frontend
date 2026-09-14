import { LogoutButtonContainer } from '../features/auth'
import { NodeHealthContainer } from '../features/node-health'
import { LiveDashboardContainer } from '../features/telemetry'

/**
 * Dashboard route: live per-sensor values over the realtime channel (D-2),
 * plus per-node online/offline (CA-6). Historical views and device
 * management are built in later phases.
 */
export function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <LogoutButtonContainer />
      </div>
      <NodeHealthContainer />
      <LiveDashboardContainer />
    </main>
  )
}
