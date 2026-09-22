import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { collectSourceFiles, type SourceFile } from '../test/collectSourceFiles'

type LayoutRule =
  | 'fixed-width'
  | 'chart-width-constant'
  | 'js-breakpoint'
  | 'unknown-breakpoint'

interface LayoutFinding {
  file: string
  line: number
  match: string
  rule: LayoutRule
}

const FIXED_WIDTH_PATTERN = /\b(?:min-)?w-\[(\d+)px\]/g
const CHART_WIDTH_PATTERN = /\bCHART_WIDTH\b/g
const JS_BREAKPOINT_PATTERN = /\bmatchMedia\b|\bwindow\.innerWidth\b/g
const MAX_FIXED_WIDTH_PX = 320

// `--breakpoint-*: initial` in index.css deletes Tailwind's defaults, so only
// these three variants exist. A prefix outside this set emits no CSS at all:
// the class is silently dropped and the layout never responds. Read from the
// stylesheet rather than hardcoded, so adding a breakpoint cannot desync them.
const BREAKPOINT_PATTERN = /--breakpoint-([a-z0-9]+):/g
const RESPONSIVE_PREFIX_PATTERN = /(?:^|\s|")([a-z][a-z0-9]*):[a-z[-]/g
const NON_BREAKPOINT_VARIANTS = new Set([
  'dark',
  'hover',
  'focus',
  'active',
  'disabled',
  'group-hover',
  'peer-focus',
  'motion-safe',
  'motion-reduce',
  'print',
  'first',
  'last',
  'odd',
  'even',
  'aria-pressed',
  'data-hidden-stacked',
])

function readDefinedBreakpoints(stylesheet: string): Set<string> {
  return new Set(
    [...stylesheet.matchAll(BREAKPOINT_PATTERN)]
      .map((match) => match[1])
      .filter((name): name is string => name !== undefined && name !== '*'),
  )
}

/**
 * Scans source text for layout patterns that break mobile-first, CSS-only
 * responsiveness (REQ-MOBILE-1, REQ-MOBILE-2): a fixed-pixel width class
 * wider than the smallest supported viewport, a `CHART_WIDTH`-style
 * constant, or JS reading `matchMedia`/`window.innerWidth` to drive layout.
 * Kept inline in this test file (no separate production module) per the
 * design's "node:fs + TypeScript compiler API, zero deps" testing strategy.
 */
function findLayoutViolations(
  sources: SourceFile[],
  breakpoints: Set<string> = new Set(['md', 'lg', 'xl']),
): LayoutFinding[] {
  const findings: LayoutFinding[] = []

  for (const { file, text } of sources) {
    text.split('\n').forEach((line, index) => {
      for (const match of line.matchAll(FIXED_WIDTH_PATTERN)) {
        if (Number(match[1]) > MAX_FIXED_WIDTH_PX) {
          findings.push({
            file,
            line: index + 1,
            match: match[0],
            rule: 'fixed-width',
          })
        }
      }
      for (const match of line.matchAll(CHART_WIDTH_PATTERN)) {
        findings.push({
          file,
          line: index + 1,
          match: match[0],
          rule: 'chart-width-constant',
        })
      }
      for (const match of line.matchAll(JS_BREAKPOINT_PATTERN)) {
        findings.push({
          file,
          line: index + 1,
          match: match[0],
          rule: 'js-breakpoint',
        })
      }
      for (const match of line.matchAll(RESPONSIVE_PREFIX_PATTERN)) {
        const prefix = match[1]
        if (
          prefix !== undefined &&
          !breakpoints.has(prefix) &&
          !NON_BREAKPOINT_VARIANTS.has(prefix)
        ) {
          findings.push({
            file,
            line: index + 1,
            match: `${prefix}:`,
            rule: 'unknown-breakpoint',
          })
        }
      }
    })
  }

  return findings
}

describe('findLayoutViolations', () => {
  it('flags a fixed-pixel width class over 320px', () => {
    const findings = findLayoutViolations([
      { file: 'Example.tsx', text: 'className="w-[400px]"' },
    ])

    expect(findings).toEqual([
      { file: 'Example.tsx', line: 1, match: 'w-[400px]', rule: 'fixed-width' },
    ])
  })

  it('does not flag a fixed-pixel width at or under 320px', () => {
    const findings = findLayoutViolations([
      { file: 'Example.tsx', text: 'className="min-w-[320px]"' },
    ])

    expect(findings).toEqual([])
  })

  it('flags a CHART_WIDTH-style constant', () => {
    const findings = findLayoutViolations([
      { file: 'Example.tsx', text: 'const CHART_WIDTH = 800' },
    ])

    expect(findings).toEqual([
      {
        file: 'Example.tsx',
        line: 1,
        match: 'CHART_WIDTH',
        rule: 'chart-width-constant',
      },
    ])
  })

  it('flags matchMedia and window.innerWidth usage', () => {
    const findings = findLayoutViolations([
      {
        file: 'Example.tsx',
        text: 'if (window.matchMedia("(min-width: 768px)").matches) {}',
      },
      { file: 'Other.tsx', text: 'const w = window.innerWidth' },
    ])

    expect(findings).toEqual([
      {
        file: 'Example.tsx',
        line: 1,
        match: 'matchMedia',
        rule: 'js-breakpoint',
      },
      {
        file: 'Other.tsx',
        line: 1,
        match: 'window.innerWidth',
        rule: 'js-breakpoint',
      },
    ])
  })

  it('flags a responsive prefix that no breakpoint token defines', () => {
    const findings = findLayoutViolations([
      { file: 'Example.tsx', text: 'className="flex-col sm:flex-row"' },
    ])

    expect(findings).toEqual([
      {
        file: 'Example.tsx',
        line: 1,
        match: 'sm:',
        rule: 'unknown-breakpoint',
      },
    ])
  })

  it('accepts the prefixes the theme actually defines', () => {
    const findings = findLayoutViolations([
      { file: 'Example.tsx', text: 'className="md:flex-row xl:table-cell"' },
    ])

    expect(findings).toEqual([])
  })

  it('reads the breakpoint names out of the stylesheet', () => {
    const breakpoints = readDefinedBreakpoints(
      '@theme {\n  --breakpoint-*: initial;\n  --breakpoint-md: 768px;\n}',
    )

    expect([...breakpoints]).toEqual(['md'])
  })
})

// REQ-MOBILE-1/REQ-MOBILE-2: no fixed-pixel layout shell over 320px, no
// `CHART_WIDTH`-style constant, and no JS-driven breakpoint logic. Widened
// in ui-redesign PR-4 to also cover `src/app` and every feature's
// `components/` directory (previously `src/shared/design-system` only).
const SCANNED_ROOTS = [
  'src/shared/design-system',
  'src/app',
  'src/features/*/components',
]

// Legacy components not yet migrated off a `CHART_WIDTH`-style constant,
// each with the PR that removes it. Do not weaken the pattern or the
// scanned roots to paper over these -- widen the exclusion list only.
const LAYOUT_EXCLUSIONS = new Set([
  'src/features/telemetry-history/components/HistoricalChart.tsx', // PR-8
])

describe('layout contract', () => {
  it('finds zero layout violations under the scanned roots', () => {
    const sources = collectSourceFiles(SCANNED_ROOTS, '.tsx').filter(
      (source) => !LAYOUT_EXCLUSIONS.has(source.file.replaceAll('\\', '/')),
    )

    const breakpoints = readDefinedBreakpoints(
      readFileSync(
        resolve(dirname(fileURLToPath(import.meta.url)), '../../index.css'),
        'utf8',
      ),
    )

    expect(findLayoutViolations(sources, breakpoints)).toEqual([])
  })
})
