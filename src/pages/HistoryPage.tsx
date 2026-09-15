import { Link, useParams } from 'react-router-dom'

import { HistoryContainer } from '../features/telemetry-history'

/** Historical series route for one sensor (CA-2). */
export function HistoryPage() {
  // Always present: the route is only matched as /history/:sensorId.
  const { sensorId } = useParams<{ sensorId: string }>() as {
    sensorId: string
  }

  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sensor {sensorId} history</h1>
        <Link to="/" className="text-sm text-slate-400">
          Back to dashboard
        </Link>
      </div>
      <HistoryContainer sensorId={sensorId} />
    </main>
  )
}
