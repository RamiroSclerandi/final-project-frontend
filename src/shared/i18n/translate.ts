import type { Locale } from './dictionary'
import { selectPluralForm } from './plural'

type TranslationParams = Record<string, string | number>

interface PluralNode {
  one: string
  other: string
}

function isPluralNode(value: unknown): value is PluralNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'one' in value &&
    'other' in value
  )
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name]
    return value === undefined ? placeholder : String(value)
  })
}

function resolveNode(dictionary: object, key: string): unknown {
  let node: unknown = dictionary
  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(segment in node)) {
      return undefined
    }
    node = (node as Record<string, unknown>)[segment]
  }
  return node
}

function resolveMissingKey(key: string, locale: Locale): string {
  if (import.meta.env.MODE === 'production') {
    return key
  }
  throw new Error(
    `Missing translation "${key}" for "${locale}"; add it to dictionaries/${locale}.ts`,
  )
}

/**
 * Resolves `key` (a dot-path) against `dictionary`, interpolating `{param}`
 * placeholders and selecting a plural form when the leaf is a `{ one, other
 * }` node and `params.count` is a number (D9, REQ-I18N-2).
 *
 * Generic over the dictionary shape so both the real `Dictionary` and small
 * test fixtures type-check without a dependency on the real `en`/`es`
 * content.
 */
export function translate<Dict extends object>(
  dictionary: Dict,
  locale: Locale,
  key: string,
  params?: TranslationParams,
): string {
  const node = resolveNode(dictionary, key)

  if (typeof node === 'string') {
    return interpolate(node, params)
  }

  if (isPluralNode(node)) {
    const count = typeof params?.count === 'number' ? params.count : undefined
    const form = count === undefined ? 'other' : selectPluralForm(locale, count)
    return interpolate(node[form], params)
  }

  return resolveMissingKey(key, locale)
}
