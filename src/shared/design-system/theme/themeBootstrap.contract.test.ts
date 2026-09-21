import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME, THEME_STORAGE_KEY } from './ThemeContext'

const indexHtml = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../../index.html'),
  'utf8',
)

/**
 * The bootstrap script duplicates the storage key and the default theme so it
 * can run before the bundle loads. These assertions fail if either copy drifts
 * from the provider's own constants.
 */
describe('theme bootstrap script', () => {
  it('runs before the module bundle so the first paint uses the stored theme', () => {
    const bootstrapIndex = indexHtml.indexOf(THEME_STORAGE_KEY)
    const bundleIndex = indexHtml.indexOf('src="/src/main.tsx"')

    expect(bootstrapIndex).toBeGreaterThan(-1)
    expect(bootstrapIndex).toBeLessThan(bundleIndex)
  })

  it('reads the same storage key the provider writes', () => {
    expect(indexHtml).toContain(THEME_STORAGE_KEY)
  })

  it('falls back to the provider default theme', () => {
    expect(indexHtml).toContain(`'${DEFAULT_THEME}'`)
  })

  it('guards the storage read so blocked site data cannot break the page', () => {
    expect(indexHtml).toMatch(/try\s*\{/)
    expect(indexHtml).toMatch(/catch\b/)
  })
})
