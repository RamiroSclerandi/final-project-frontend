/** Declared locally (D-1) -- structurally identical to `SignalBars`' `SignalBarsCount`. */
export type BarsCount = 0 | 1 | 2 | 3 | 4

const STRONG_THRESHOLD = -60
const GOOD_THRESHOLD = -70
const FAIR_THRESHOLD = -80
const WEAK_THRESHOLD = -90

/**
 * Maps a node's rssi to a 0-4 bar count (D12). `null` (no recent signal
 * sample) maps to `0`, the same "unknown" variant as a signal too weak to
 * register -- `SignalBars` always pairs bar `0` with visible text, so the
 * two cases are never silently indistinguishable to the user.
 */
export function rssiToBars(rssi: number | null): BarsCount {
  if (rssi === null) {
    return 0
  }
  if (rssi >= STRONG_THRESHOLD) {
    return 4
  }
  if (rssi >= GOOD_THRESHOLD) {
    return 3
  }
  if (rssi >= FAIR_THRESHOLD) {
    return 2
  }
  if (rssi >= WEAK_THRESHOLD) {
    return 1
  }
  return 0
}
