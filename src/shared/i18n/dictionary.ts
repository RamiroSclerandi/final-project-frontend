import { en } from './dictionaries/en'

export type Dictionary = typeof en
export type Locale = 'es' | 'en'

/** An `Intl.PluralRules`-driven leaf: `{ one: '...', other: '...' }`. */
interface PluralForm {
  one: string
  other: string
}

/**
 * Every dot-path key reachable in a dictionary, stopping at string leaves
 * and plural-form leaves. Mirrors `dictionaries.parity.test.ts`'s
 * `flattenDictionaryKeys` at the type level (D9).
 */
type DotPath<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : T[K] extends PluralForm
      ? `${P}${K}`
      : DotPath<T[K], `${P}${K}.`>
}[keyof T & string]

export type TranslationKey = DotPath<Dictionary>
