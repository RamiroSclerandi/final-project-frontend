import { describe, expect, it } from 'vitest'

import {
  collectSourceFiles,
  type SourceFile,
} from '../../test/collectSourceFiles'

interface PaletteFinding {
  file: string
  line: number
  match: string
}

const RAW_PALETTE_PATTERN =
  /\b(bg|text|border|fill|stroke|ring|from|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g

/**
 * Scans source text for raw Tailwind color-palette utility classes
 * (REQ-DT-1). Presentational components must reference only the semantic
 * token classes defined by `@theme inline` in `src/index.css`. Kept inline
 * in this test file (no separate production module) per the design's
 * "node:fs + TypeScript compiler API, zero deps" testing strategy.
 */
function findRawPaletteClasses(sources: SourceFile[]): PaletteFinding[] {
  const findings: PaletteFinding[] = []

  for (const { file, text } of sources) {
    text.split('\n').forEach((line, index) => {
      for (const match of line.matchAll(RAW_PALETTE_PATTERN)) {
        findings.push({ file, line: index + 1, match: match[0] })
      }
    })
  }

  return findings
}

describe('findRawPaletteClasses', () => {
  it('flags a raw Tailwind palette utility class with its file and line', () => {
    const findings = findRawPaletteClasses([
      { file: 'Example.tsx', text: 'const cls = "text-red-500"' },
    ])

    expect(findings).toEqual([
      { file: 'Example.tsx', line: 1, match: 'text-red-500' },
    ])
  })

  it('does not flag a semantic token class', () => {
    const findings = findRawPaletteClasses([
      { file: 'Example.tsx', text: 'className="text-danger bg-surface"' },
    ])

    expect(findings).toEqual([])
  })
})

// REQ-DT-1: presentational components must consume only semantic token
// classes, never raw Tailwind palette classes. Scope starts at the shared
// design system; each feature's `components/` directory is added here only
// once that feature has been restyled off raw palette classes (tracked in
// apply-progress -- legacy `features/*/components` still use them and would
// fail this contract today).
const SCANNED_ROOTS = ['src/shared/design-system']

describe('palette contract', () => {
  it('finds zero raw palette classes under the scanned design-system roots', () => {
    const sources = collectSourceFiles(SCANNED_ROOTS, '.tsx')

    expect(findRawPaletteClasses(sources)).toEqual([])
  })
})
