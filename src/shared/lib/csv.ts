/** RFC 4180 field quoting: comma, quote, or newline forces quoting, with embedded quotes doubled. */
function toCsvField(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Builds a CSV string with a header row (D-1: shared/lib pure helper). */
export function buildCsv(
  header: string[],
  rows: (string | number)[][],
): string {
  return [header, ...rows]
    .map((fields) => fields.map(toCsvField).join(','))
    .join('\r\n')
}
