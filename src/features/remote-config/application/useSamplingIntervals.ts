import { useMemo } from 'react'

import { useDeviceConfigs } from './useDeviceConfigs'

/** Requested sampling interval per device id; devices with no request are absent. */
export function useSamplingIntervals(): Record<string, number> {
  const { data } = useDeviceConfigs()
  return useMemo(
    () =>
      Object.fromEntries(
        (data ?? []).flatMap((summary) =>
          summary.config
            ? [[summary.deviceId, summary.config.samplingIntervalMs]]
            : [],
        ),
      ),
    [data],
  )
}
