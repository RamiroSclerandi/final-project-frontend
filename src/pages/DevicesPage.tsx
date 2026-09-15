import { Link } from 'react-router-dom'

import { DeviceManagementContainer } from '../features/device-management'
import { RemoteConfigContainer } from '../features/remote-config'

/** Device and sensor management route (CA-3), plus remote config (Increment 4). */
export function DevicesPage() {
  return (
    <main className="flex min-h-screen flex-col gap-6 bg-slate-950 px-4 py-8 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Devices</h1>
        <Link to="/" className="text-sm text-slate-400">
          Back to dashboard
        </Link>
      </div>
      <DeviceManagementContainer />
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Sampling interval</h2>
        <RemoteConfigContainer />
      </div>
    </main>
  )
}
