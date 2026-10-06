import { useState, type FormEvent, type ReactNode } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { Skeleton } from '../../../shared/design-system/atoms/Skeleton'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useDevices } from '../application/useDevices'
import { useUpdateDevice } from '../application/useUpdateDevice'
import { useUpdateSensor } from '../application/useUpdateSensor'
import { DeviceEditForm } from '../components/DeviceEditForm'
import { SensorEditForm } from '../components/SensorEditForm'
import type { Device, SensorSummary } from '../domain/device'
import type { DeviceUpdate } from '../domain/deviceUpdate'
import type { SensorUpdate } from '../domain/sensorUpdate'
import { toSafeUpdateErrorMessage } from '../domain/updateError'

export interface DeviceConfigContainerProps {
  deviceId: string
  onCancel?: () => void
}

function deviceBaseline(device: Device): DeviceUpdate {
  return {
    name: device.name,
    location_ref: device.locationRef === '' ? null : device.locationRef,
    transport: device.transport,
    provisioned: device.provisioned,
  }
}

function sensorBaseline(sensor: SensorSummary): SensorUpdate {
  return {
    label: sensor.label === '' ? null : sensor.label,
    pin_connection: sensor.pinConnection === '' ? null : sensor.pinConnection,
  }
}

// A draft only counts as an edit when some field differs from what the server
// already holds, so a form typed into and then reverted is never sent.
function differsFrom<T extends object>(draft: T, baseline: T): boolean {
  return (Object.keys(draft) as (keyof T)[]).some(
    (key) => (draft[key] ?? null) !== (baseline[key] ?? null),
  )
}

interface ConfigSectionProps {
  title: string
  children: ReactNode
}

function ConfigSection({ title, children }: ConfigSectionProps) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border p-4">
      <h3 className="text-xs font-medium uppercase tracking-label text-text-muted">
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * One device's identification and sensor-labeling sections inside
 * `NodeConfigDrawer` (CA-3, REQ-CFG-2, REQ-CFG-4, REQ-DM-5), sharing a
 * single form whose sticky footer Save sends only the edited device and
 * sensors. Renders nothing for a `deviceId` not present in the fetched
 * devices -- the drawer only mounts this once the node is confirmed to exist.
 */
export function DeviceConfigContainer({
  deviceId,
  onCancel,
}: DeviceConfigContainerProps) {
  const { t } = useTranslation()
  const { data: devices, isLoading } = useDevices()
  const updateDeviceMutation = useUpdateDevice()
  const updateSensorMutation = useUpdateSensor()
  const [deviceDraft, setDeviceDraft] = useState<DeviceUpdate | null>(null)
  const [sensorDrafts, setSensorDrafts] = useState<
    Record<string, SensorUpdate>
  >({})
  const [draftGeneration, setDraftGeneration] = useState(0)
  // A useMutation observer only tracks its last mutate call, so each call's
  // outcome is tracked here to keep an earlier failure from being masked.
  const [pendingCount, setPendingCount] = useState(0)
  const [deviceError, setDeviceError] = useState<{ error: unknown } | null>(
    null,
  )
  const [sensorErrors, setSensorErrors] = useState<Record<string, unknown>>({})

  if (isLoading) {
    return <Skeleton lines={3} />
  }

  const device = devices?.find((candidate) => candidate.id === deviceId)

  if (!device) {
    return null
  }

  const isSaving = pendingCount > 0
  const hasFailure =
    deviceError !== null || Object.keys(sensorErrors).length > 0

  const editedDevice =
    deviceDraft && differsFrom(deviceDraft, deviceBaseline(device))
      ? deviceDraft
      : null
  const editedSensors = device.sensors.flatMap((sensor) => {
    const draft = sensorDrafts[sensor.id]
    return draft && differsFrom(draft, sensorBaseline(sensor))
      ? [{ sensorId: sensor.id, update: draft }]
      : []
  })
  const hasEdits = editedDevice !== null || editedSensors.length > 0

  function trackCall(
    call: Promise<unknown>,
    onFailure: (error: unknown) => void,
  ) {
    setPendingCount((count) => count + 1)
    call.catch(onFailure).finally(() => setPendingCount((count) => count - 1))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDeviceError(null)
    setSensorErrors({})
    if (editedDevice) {
      trackCall(
        updateDeviceMutation.mutateAsync({ deviceId, update: editedDevice }),
        (error) => setDeviceError({ error }),
      )
    }
    for (const { sensorId, update } of editedSensors) {
      trackCall(
        updateSensorMutation.mutateAsync({ sensorId, update }),
        (error) =>
          setSensorErrors((errors) => ({ ...errors, [sensorId]: error })),
      )
    }
  }

  function handleCancel() {
    setDeviceDraft(null)
    setSensorDrafts({})
    setDraftGeneration((generation) => generation + 1)
    onCancel?.()
  }

  function handleDismissError() {
    setDeviceError(null)
    setSensorErrors({})
    updateDeviceMutation.reset()
    updateSensorMutation.reset()
  }

  // `contents` lets the sections and the sticky footer sit directly in the
  // drawer's scrolling body, so the footer stays pinned across all sections.
  return (
    <form onSubmit={handleSubmit} className="contents">
      <ConfigSection title={t('config.section.identification')}>
        <DeviceEditForm
          key={draftGeneration}
          device={device}
          onChange={setDeviceDraft}
          errorMessage={
            deviceError ? toSafeUpdateErrorMessage(deviceError.error) : null
          }
        />
      </ConfigSection>
      {device.sensors.length > 0 && (
        <ConfigSection title={t('config.section.sensors')}>
          {device.sensors.map((sensor) => (
            <SensorEditForm
              key={`${sensor.id}-${draftGeneration}`}
              sensor={sensor}
              onChange={(update) =>
                setSensorDrafts((drafts) => ({
                  ...drafts,
                  [sensor.id]: update,
                }))
              }
              errorMessage={
                sensor.id in sensorErrors
                  ? toSafeUpdateErrorMessage(sensorErrors[sensor.id])
                  : null
              }
            />
          ))}
        </ConfigSection>
      )}
      <div className="sticky bottom-0 -mx-4 mt-auto flex items-center justify-end gap-2 border-t border-border bg-surface p-4">
        {hasFailure && (
          <span className="mr-auto">
            <Button variant="secondary" onClick={handleDismissError}>
              {t('common.dismiss')}
            </Button>
          </span>
        )}
        <Button variant="secondary" onClick={handleCancel}>
          {t('config.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!hasEdits || isSaving}
        >
          {t('config.save')}
        </Button>
      </div>
    </form>
  )
}
