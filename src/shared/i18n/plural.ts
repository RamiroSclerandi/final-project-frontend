import type { Locale } from './dictionary'

/**
 * Resolves the plural category for a count, per locale (D9). Dictionary
 * plural leaves only ever declare `one`/`other`, so any other CLDR category
 * (`few`, `many`, `two`, `zero` -- not used by es/en cardinals) folds to
 * `other`.
 */
export function selectPluralForm(
  locale: Locale,
  count: number,
): 'one' | 'other' {
  const category = new Intl.PluralRules(locale).select(count)
  return category === 'one' ? 'one' : 'other'
}
