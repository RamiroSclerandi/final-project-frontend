import { useDeviceConfigs } from '../application/useDeviceConfigs'
import { useSetSamplingInterval } from '../application/useSetSamplingInterval'
import { toSafeSamplingIntervalErrorMessage } from '../domain/setIntervalError'
import { SamplingIntervalList } from '../components/SamplingIntervalList'

/** Wires the device-configs fetch and the set-sampling-interval mutation (remote-config, Increment 4). */
export function RemoteConfigContainer() {
  const { data: summaries, isLoading } = useDeviceConfigs()
  const setSamplingIntervalMutation = useSetSamplingInterval()

  if (isLoading) {
    return <p className="text-slate-400">Loading sampling intervals…</p>
  }

  const attemptedDeviceId =
    setSamplingIntervalMutation.variables?.deviceId ?? null
  const savingDeviceId = setSamplingIntervalMutation.isPending
    ? attemptedDeviceId
    : null
  const errorDeviceId = setSamplingIntervalMutation.isError
    ? attemptedDeviceId
    : null
  const errorMessage = errorDeviceId
    ? toSafeSamplingIntervalErrorMessage(setSamplingIntervalMutation.error)
    : null

  return (
    <SamplingIntervalList
      summaries={summaries ?? []}
      onApply={(deviceId, samplingIntervalMs) =>
        setSamplingIntervalMutation.mutate({ deviceId, samplingIntervalMs })
      }
      savingDeviceId={savingDeviceId}
      errorDeviceId={errorDeviceId}
      errorMessage={errorMessage}
    />
  )
}
