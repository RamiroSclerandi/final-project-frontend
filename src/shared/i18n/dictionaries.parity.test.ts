import { describe, expect, it } from 'vitest'

import { en } from './dictionaries/en'
import { es } from './dictionaries/es'

/** A `{ one, other }` object is a plural leaf, not a nesting level (D9). */
function isPluralLeaf(value: unknown): value is { one: string; other: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'one' in value &&
    'other' in value
  )
}

function flattenDictionaryKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (
      typeof nested === 'object' &&
      nested !== null &&
      !isPluralLeaf(nested)
    ) {
      return flattenDictionaryKeys(nested, path)
    }
    return [path]
  })
}

function symmetricDifference(a: string[], b: string[]): string[] {
  const setA = new Set(a)
  const setB = new Set(b)
  return [...setA, ...setB].filter((key) => setA.has(key) !== setB.has(key))
}

describe('flattenDictionaryKeys', () => {
  it('flattens nested keys to dot-paths', () => {
    expect(flattenDictionaryKeys({ a: { b: 'x', c: 'y' } })).toEqual([
      'a.b',
      'a.c',
    ])
  })

  it('treats a { one, other } leaf as a single key', () => {
    expect(flattenDictionaryKeys({ count: { one: 'x', other: 'y' } })).toEqual([
      'count',
    ])
  })
})

describe('symmetricDifference', () => {
  it('reports a key present in only one dictionary', () => {
    const a = flattenDictionaryKeys({ shell: { brand: 'x' } })
    const b = flattenDictionaryKeys({ shell: { brand: 'x', extra: 'y' } })

    expect(symmetricDifference(a, b)).toEqual(['shell.extra'])
  })
})

describe('dictionary parity', () => {
  it('has an identical flattened key set between the real es and en dictionaries', () => {
    const difference = symmetricDifference(
      flattenDictionaryKeys(en),
      flattenDictionaryKeys(es),
    )

    expect(difference).toEqual([])
  })
})
