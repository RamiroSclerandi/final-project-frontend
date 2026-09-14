import { LogoutButtonContainer } from '../features/auth'

/**
 * Placeholder dashboard route for this slice. The live dashboard (Realtime
 * telemetry, historical views) is built in later phases; this page only
 * proves the authenticated route and logout action work end to end.
 */
export function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-slate-100">
      <p className="text-lg">
        Dashboard placeholder — coming in a later phase.
      </p>
      <LogoutButtonContainer />
    </main>
  )
}
