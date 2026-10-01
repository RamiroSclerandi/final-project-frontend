import { useMemo } from 'react'

import { useDeviceConfigs } from './useDeviceConfigs'

/**
 * Requested sampling interval per device id; devices with no request are
 * absent. `null` until the configs query succeeds.
 */
export function useSamplingIntervals(): Record<string, number> | null {
  const { data } = useDeviceConfigs()
  return useMemo(
    () =>
      data
        ? Object.fromEntries(
            data.flatMap((summary) =>
              summary.config
                ? [[summary.deviceId, summary.config.samplingIntervalMs]]
                : [],
            ),
          )
        : null,
    [data],
  )
}
