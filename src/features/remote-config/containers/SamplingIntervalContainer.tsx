import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDeviceConfigs } from '../application/useDeviceConfigs'
import { useSetSamplingInterval } from '../application/useSetSamplingInterval'
import { SamplingIntervalControl } from '../components/SamplingIntervalControl'
import { toSafeSamplingIntervalErrorMessage } from '../domain/setIntervalError'

export interface SamplingIntervalContainerProps {
  deviceId: string
}

/**
 * One device's sampling-interval section inside `NodeConfigDrawer`
 * (REQ-RC-1..8, REQ-RC-11, REQ-RC-12). Renders nothing for a `deviceId`
 * with no config-summary row yet -- the drawer only mounts this once the
 * node it belongs to is already confirmed to exist.
 */
export function SamplingIntervalContainer({
  deviceId,
}: SamplingIntervalContainerProps) {
  const { t } = useTranslation()
  const { data: summaries, isLoading } = useDeviceConfigs()
  const setSamplingIntervalMutation = useSetSamplingInterval()

  if (isLoading) {
    return <Skeleton lines={2} />
  }

  const summary = summaries?.find(
    (candidate) => candidate.deviceId === deviceId,
  )

  if (!summary) {
    return null
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
    <div className="flex flex-col gap-2">
      <SamplingIntervalControl
        summary={summary}
        onApply={(samplingIntervalMs) =>
          setSamplingIntervalMutation.mutate({ deviceId, samplingIntervalMs })
        }
        isSaving={savingDeviceId === deviceId}
        errorMessage={errorDeviceId === deviceId ? errorMessage : null}
      />
      {errorDeviceId !== null && (
        <Button
          variant="secondary"
          onClick={() => setSamplingIntervalMutation.reset()}
        >
          {t('common.dismiss')}
        </Button>
      )}
    </div>
  )
}
