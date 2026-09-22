import { Link, useParams } from 'react-router-dom'

import {
  HistoryContainer,
  HistoryTitleContainer,
} from '../features/telemetry-history'

/**
 * Historical series route for one sensor (CA-2). Mounted as a child of the
 * app shell (ui-redesign PR-3): its root element is a `<div>`, not a
 * `<main>`, since the shell's own `<main id="main">` already owns that
 * landmark. Replaced by `SensorPage` in PR-8.
 */
export function HistoryPage() {
  // Always present: the route is only matched as /history/:sensorId.
  const { sensorId } = useParams<{ sensorId: string }>() as {
    sensorId: string
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <HistoryTitleContainer sensorId={sensorId} />
        <Link to="/" className="text-sm text-slate-400">
          Back to dashboard
        </Link>
      </div>
      <HistoryContainer sensorId={sensorId} />
    </div>
  )
}
