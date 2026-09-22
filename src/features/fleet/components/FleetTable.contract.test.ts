import { describe, expect, it } from 'vitest'

import { collectSourceFiles } from '../../../shared/test/collectSourceFiles'

const FIXED_WIDTH_PATTERN = /\b(?:min-)?w-\[(\d+)px\]/g
const CHART_WIDTH_PATTERN = /\bCHART_WIDTH\b/g
const MAX_FIXED_WIDTH_PX = 320

/**
 * REQ-FLEET-6: `FleetTable`'s root wrapper must stay fluid -- no fixed-pixel
 * width over 320px, no `CHART_WIDTH`-style constant. Narrower duplicate of
 * `layout.contract.test.ts`'s patterns, scoped to this one file so it can
 * run (and fail) before `src/features/fleet` is added to that scanner's
 * roots.
 */
describe('FleetTable layout contract', () => {
  it('declares no fixed-pixel width over 320px and no CHART_WIDTH constant', () => {
    const source = collectSourceFiles(
      ['src/features/fleet/components'],
      '.tsx',
    ).find((file) => file.file.endsWith('FleetTable.tsx'))
    expect(source).toBeDefined()

    const text = source?.text ?? ''
    const fixedWidthViolations = [...text.matchAll(FIXED_WIDTH_PATTERN)].filter(
      (match) => Number(match[1]) > MAX_FIXED_WIDTH_PX,
    )

    expect(fixedWidthViolations).toEqual([])
    expect(text).not.toMatch(CHART_WIDTH_PATTERN)
    expect(text).toMatch(/\bmin-w-0\b/)
  })
})
