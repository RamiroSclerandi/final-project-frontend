import { describe, expect, it } from 'vitest'

import { collectSourceFiles } from './collectSourceFiles'

describe('collectSourceFiles', () => {
  it('returns an empty list for a literal root that does not exist', () => {
    expect(collectSourceFiles(['src/does-not-exist'], '.tsx')).toEqual([])
  })

  it('expands a `*` wildcard segment to every immediate child directory', () => {
    const sources = collectSourceFiles(['src/features/*/domain'], '.ts')
    const files = sources.map((source) => source.file)

    expect(
      files.some((file) => file.includes('fleet') && file.includes('domain')),
    ).toBe(true)
    expect(
      files.some(
        (file) => file.includes('device-management') && file.includes('domain'),
      ),
    ).toBe(true)
  })

  it('excludes test files from a wildcard-expanded root', () => {
    const sources = collectSourceFiles(['src/features/*/domain'], '.ts')

    expect(sources.every((source) => !source.file.endsWith('.test.ts'))).toBe(
      true,
    )
  })
})
