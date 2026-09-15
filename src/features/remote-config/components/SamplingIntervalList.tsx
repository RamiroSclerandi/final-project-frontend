import type { DeviceConfigSummary } from '../domain/deviceConfig'
import { SamplingIntervalControl } from './SamplingIntervalControl'

export interface SamplingIntervalListProps {
  summaries: DeviceConfigSummary[]
  onApply: (deviceId: string, samplingIntervalMs: number) => void
  savingDeviceId: string | null
  errorDeviceId: string | null
  errorMessage: string | null
}

/** One sampling-interval control per device (remote-config, Increment 4). */
export function SamplingIntervalList({
  summaries,
  onApply,
  savingDeviceId,
  errorDeviceId,
  errorMessage,
}: SamplingIntervalListProps) {
  if (summaries.length === 0) {
    return <p className="text-slate-400">No devices yet.</p>
  }

  return (
    <ul className="flex flex-col gap-4">
      {summaries.map((summary) => (
        <li
          key={summary.deviceId}
          className="rounded border border-slate-800 bg-slate-900 p-4"
        >
          <SamplingIntervalControl
            summary={summary}
            onApply={(samplingIntervalMs) =>
              onApply(summary.deviceId, samplingIntervalMs)
            }
            isSaving={savingDeviceId === summary.deviceId}
            errorMessage={
              errorDeviceId === summary.deviceId ? errorMessage : null
            }
          />
        </li>
      ))}
    </ul>
  )
}
