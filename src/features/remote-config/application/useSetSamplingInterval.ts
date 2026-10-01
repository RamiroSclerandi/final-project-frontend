import { useMutation, useQueryClient } from '@tanstack/react-query'

import { DEVICE_CONFIGS_QUERY_KEY } from '../domain/queryKeys'
import { setSamplingInterval } from '../infrastructure/remoteConfigRepository'

/**
 * Requests a new sampling interval for one device (REQ-RC-1..8). Refetches
 * the config list on success rather than guessing `requested_at`, which the
 * function's response does not carry.
 */
export function useSetSamplingInterval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      deviceId,
      samplingIntervalMs,
    }: {
      deviceId: string
      samplingIntervalMs: number
    }) => setSamplingInterval(deviceId, samplingIntervalMs),
    // A 502 still saved the request, so refresh after failures too.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DEVICE_CONFIGS_QUERY_KEY })
    },
  })
}
