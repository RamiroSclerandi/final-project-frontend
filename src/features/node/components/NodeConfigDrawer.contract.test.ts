import { describe, expect, it } from 'vitest'

import { collectSourceFiles } from '../../../shared/test/collectSourceFiles'

/**
 * REQ-CFG-5: the dialog element must carry both its desktop side-panel
 * classes and its mobile full-screen classes at once -- layout resolves in
 * CSS only, never by branching in JS. Source-scoped, same shape as
 * `fleet/components/FleetTable.contract.test.ts`.
 */
describe('NodeConfigDrawer layout contract', () => {
  it('carries both the mobile full-screen and the desktop side-panel classes on the dialog element', () => {
    const source = collectSourceFiles(
      ['src/features/node/components'],
      '.tsx',
    ).find((file) => file.file.endsWith('NodeConfigDrawer.tsx'))
    expect(source).toBeDefined()

    const text = source?.text ?? ''

    // Mobile full-screen: fills the viewport, no max width.
    expect(text).toMatch(/\bh-dvh\b/)
    expect(text).toMatch(/\bw-full\b/)
    expect(text).toMatch(/\bmax-w-none\b/)
    // Desktop side-panel: a fixed-width panel pinned to the trailing edge.
    expect(text).toMatch(/\bmd:w-96\b/)
    expect(text).toMatch(/\bmd:right-0\b/)
  })
})
