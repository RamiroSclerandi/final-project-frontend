import { describe, expect, it } from 'vitest'

import { buildCsv } from './csv'

describe('buildCsv', () => {
  it('joins the header and rows with CRLF (RFC 4180)', () => {
    const csv = buildCsv(['a', 'b'], [[1, 'x']])

    expect(csv).toBe('a,b\r\n1,x')
  })

  it('quotes a field containing a comma, quote, or newline, doubling embedded quotes', () => {
    const csv = buildCsv(
      ['a'],
      [['has,comma'], ['has"quote'], ['has\nnewline']],
    )

    expect(csv).toBe('a\r\n"has,comma"\r\n"has""quote"\r\n"has\nnewline"')
  })

  it('produces only the header row for an empty data set', () => {
    const csv = buildCsv(['a', 'b'], [])

    expect(csv).toBe('a,b')
  })
})
