/** Upper bound of raw rows one chart or CSV request may download. */
export const MAX_RAW_ROWS = 50_000

/** A raw range holds more rows than the caller allowed; use an aggregate instead. */
export class RawRowLimitError extends Error {
  readonly rowCount: number
  readonly maxRows: number

  constructor(rowCount: number, maxRows: number) {
    super(
      `Raw range has ${rowCount} rows, above the ${maxRows} limit; narrow the range or use hourly data.`,
    )
    this.name = 'RawRowLimitError'
    this.rowCount = rowCount
    this.maxRows = maxRows
  }
}
