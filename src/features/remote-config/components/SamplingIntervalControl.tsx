import { useState } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'
import { useNow } from '../../../shared/time/useNow'
import type { DeviceConfigSummary } from '../domain/deviceConfig'
import {
  MAX_SAMPLING_INTERVAL_SECONDS,
  MIN_SAMPLING_INTERVAL_SECONDS,
  isSamplingIntervalMsInRange,
  samplingIntervalMsToSeconds,
  samplingIntervalSecondsToMs,
} from '../domain/samplingInterval'

export interface SamplingIntervalControlProps {
  summary: DeviceConfigSummary
  onApply: (samplingIntervalMs: number) => void
  isSaving: boolean
  errorMessage: string | null
}

/**
 * One device's sampling-interval control (REQ-RC-2, REQ-RC-3, REQ-CFG-3,
 * REQ-RC-11). Requested-only display -- the firmware never reports an
 * applied value back, so no "applied" text is ever rendered.
 */
export function SamplingIntervalControl({
  summary,
  onApply,
  isSaving,
  errorMessage,
}: SamplingIntervalControlProps) {
  const { t, formatRelativeTime } = useTranslation()
  const nowMs = useNow()
  const { deviceId, deviceName, config } = summary
  const [seconds, setSeconds] = useState(
    config
      ? String(samplingIntervalMsToSeconds(config.samplingIntervalMs))
      : '',
  )
  const ms = samplingIntervalSecondsToMs(Number(seconds))
  const isValid = seconds !== '' && isSamplingIntervalMsInRange(ms)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <p className="w-full font-medium text-text">{deviceName}</p>
      <p className="w-full text-sm text-text-muted">
        {config
          ? t('config.requested', {
              seconds: samplingIntervalMsToSeconds(config.samplingIntervalMs),
              relative: formatRelativeTime(config.requestedAt, nowMs),
            })
          : t('config.notConfigured')}
      </p>
      <TextField
        id={`sampling-interval-${deviceId}`}
        label={t('config.samplingIntervalLabel')}
        type="number"
        value={seconds}
        onChange={setSeconds}
      />
      {!isValid && seconds !== '' ? (
        <p role="alert" className="w-full text-sm text-warning">
          {t('config.rangeError', {
            min: MIN_SAMPLING_INTERVAL_SECONDS,
            max: MAX_SAMPLING_INTERVAL_SECONDS,
          })}
        </p>
      ) : errorMessage ? (
        <p role="alert" className="w-full text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
      <Button
        variant="primary"
        disabled={!isValid || isSaving}
        onClick={() => onApply(ms)}
      >
        {t('config.apply')}
      </Button>
    </div>
  )
}
