import { useState } from 'react'

import { Button } from '../../../shared/design-system/atoms/Button'
import { ClockIcon, UnsetIcon } from '../../../shared/design-system/atoms/icons'
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
 * applied value back, so no "applied" text is ever rendered. It keeps its
 * own Apply because the interval is a remote command with its own lifecycle.
 */
export function SamplingIntervalControl({
  summary,
  onApply,
  isSaving,
  errorMessage,
}: SamplingIntervalControlProps) {
  const { t, formatRelativeTime } = useTranslation()
  const nowMs = useNow()
  const { deviceId, config } = summary
  const inputId = `sampling-interval-${deviceId}`
  const [seconds, setSeconds] = useState(
    config
      ? String(samplingIntervalMsToSeconds(config.samplingIntervalMs))
      : '',
  )
  const ms = samplingIntervalSecondsToMs(Number(seconds))
  const isValid = seconds !== '' && isSamplingIntervalMsInRange(ms)

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        className="text-xs font-medium uppercase tracking-label text-text-muted"
      >
        {t('config.samplingIntervalLabel')}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-2">
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            className="min-h-14 w-32 rounded-md border border-border-strong bg-sunken px-3 font-mono text-xl tabular-nums text-text focus:border-accent"
          />
          <span className="font-mono text-lg text-text-muted">
            {t('config.secondsUnit')}
          </span>
        </div>
        <span className="ml-auto">
          <Button
            variant="primary"
            disabled={!isValid || isSaving}
            onClick={() => onApply(ms)}
          >
            {t('config.apply')}
          </Button>
        </span>
      </div>
      {config ? (
        <p className="flex items-center gap-2 font-mono text-sm tabular-nums text-warning">
          <ClockIcon className="h-4 w-4 shrink-0" />
          {t('config.requested', {
            seconds: samplingIntervalMsToSeconds(config.samplingIntervalMs),
            relative: formatRelativeTime(config.requestedAt, nowMs),
          })}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-status-unknown">
          <UnsetIcon className="h-4 w-4 shrink-0" />
          {t('config.notConfigured')}
        </p>
      )}
      {!isValid && seconds !== '' ? (
        <p role="alert" className="text-sm text-warning">
          {t('config.rangeError', {
            min: MIN_SAMPLING_INTERVAL_SECONDS,
            max: MAX_SAMPLING_INTERVAL_SECONDS,
          })}
        </p>
      ) : errorMessage ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
