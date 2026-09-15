import { useState } from 'react'

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
 * One device's sampling-interval control (REQ-RC-2, REQ-RC-3). No
 * applied-state UI: the firmware never reports the applied value back.
 */
export function SamplingIntervalControl({
  summary,
  onApply,
  isSaving,
  errorMessage,
}: SamplingIntervalControlProps) {
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
      <p className="w-full font-medium">{deviceName}</p>
      <p className="w-full text-xs text-slate-500">
        {config
          ? `Requested ${samplingIntervalMsToSeconds(config.samplingIntervalMs)}s at ${config.requestedAt}`
          : 'Not configured'}
      </p>
      <div className="flex flex-col gap-1">
        <label htmlFor={`sampling-interval-${deviceId}`}>
          Sampling interval (seconds)
        </label>
        <input
          id={`sampling-interval-${deviceId}`}
          type="number"
          min={MIN_SAMPLING_INTERVAL_SECONDS}
          max={MAX_SAMPLING_INTERVAL_SECONDS}
          value={seconds}
          onChange={(event) => setSeconds(event.target.value)}
        />
      </div>
      {!isValid && seconds !== '' ? (
        <p role="alert" className="w-full text-sm text-amber-400">
          Enter a value between {MIN_SAMPLING_INTERVAL_SECONDS} and{' '}
          {MAX_SAMPLING_INTERVAL_SECONDS} seconds.
        </p>
      ) : errorMessage ? (
        <p role="alert" className="w-full text-sm text-red-500">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!isValid || isSaving}
        onClick={() => onApply(ms)}
      >
        Apply
      </button>
    </div>
  )
}
