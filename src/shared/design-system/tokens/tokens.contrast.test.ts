import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { contrastRatio, parseThemeTokens } from './contrastRatio'

// REQ-DT-3: every semantic token pair meets the WCAG AA floor in both
// themes. Reading `src/index.css` directly keeps the test and the
// stylesheet as a single source of truth (D6) -- no duplicated color
// values in a TS fixture that could drift from the real tokens.
const currentDir = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(currentDir, '../../../index.css'), 'utf-8')
const tokens = parseThemeTokens(css)

// [foreground, background, minimum ratio]
const tokenPairs: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text-muted', 'surface', 4.5],
  ['accent', 'surface', 3],
  ['focus', 'bg', 3],
  ['status-online', 'surface', 3],
  ['status-offline', 'surface', 3],
  ['status-unknown', 'surface', 3],
  ['quality-out-of-range', 'surface', 3],
  ['quality-suspect', 'surface', 3],
  ['border', 'surface', 1.5],
  ['text-muted', 'sunken', 4.5],
  ['text-muted', 'surface-raised', 4.5],
  ['border-strong', 'surface', 3],
  ['status-online', 'status-online-soft', 4.5],
  ['danger', 'danger-soft', 4.5],
  ['warning', 'warning-soft', 4.5],
  ['info', 'info-soft', 4.5],
  ['accent', 'accent-soft', 4.5],
]

describe('contrastRatio', () => {
  it('computes the WCAG relative-luminance ratio for a pure black/white pair', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })
})

describe.each(['dark', 'light'] as const)(
  'token contrast in %s theme',
  (theme) => {
    it.each(tokenPairs)('%s on %s is at least %s:1', (fg, bg, minimum) => {
      const fgHex = tokens[theme][fg]
      const bgHex = tokens[theme][bg]
      expect(
        fgHex,
        `--${fg} is defined for [data-theme='${theme}']`,
      ).toBeDefined()
      expect(
        bgHex,
        `--${bg} is defined for [data-theme='${theme}']`,
      ).toBeDefined()

      expect(
        contrastRatio(fgHex as string, bgHex as string),
      ).toBeGreaterThanOrEqual(minimum)
    })
  },
)
