const DAY_MS = 24 * 60 * 60 * 1000

/** Widest range `get_sensor_series` accepts for minute buckets (inclusive). */
export const MAX_MINUTE_SERIES_RANGE_MS = 7 * DAY_MS

/** A minute series was requested for a range the server would reject. */
export class SeriesRangeLimitError extends Error {
  readonly rangeMs: number

  constructor(rangeMs: number) {
    super(
      `Minute buckets cover at most 7 days, got ${Math.ceil(rangeMs / DAY_MS)} days; narrow the range or pick hourly data.`,
    )
    this.name = 'SeriesRangeLimitError'
    this.rangeMs = rangeMs
  }
}
