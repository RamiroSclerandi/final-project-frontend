import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { collectSourceFiles, type SourceFile } from '../test/collectSourceFiles'

interface LiteralFinding {
  file: string
  line: number
  text: string
}

/** Separators, punctuation, symbols, digits, and whitespace only -- never needs translation. */
const PUNCTUATION_ONLY_PATTERN = /^[\p{P}\p{S}\p{N}\s]*$/u
const HAS_LETTER_PATTERN = /\p{L}/u
const EXEMPT_ATTRIBUTES = new Set([
  'title',
  'aria-label',
  'placeholder',
  'alt',
  'aria-description',
  'aria-roledescription',
])

function isUserFacingText(text: string): boolean {
  return HAS_LETTER_PATTERN.test(text) && !PUNCTUATION_ONLY_PATTERN.test(text)
}

function lineOf(node: ts.Node, source: ts.SourceFile): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
}

function stringLiteralText(expression: ts.Expression): string | null {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text
  }
  return null
}

/**
 * A JSX comment child, e.g. `{/* i18n-exempt: unit symbol *\/}`, is parsed
 * as a `JsxExpression` with no `expression` -- its comment text lives in the
 * node's own full text, not as leading trivia on the next sibling. Walking
 * `children` in order and tracking an `exempt` flag is what lets one
 * `i18n-exempt:` marker cover the very next text-bearing child.
 */
function checkJsxChildren(
  node: ts.JsxElement | ts.JsxFragment,
  source: ts.SourceFile,
  file: string,
  findings: LiteralFinding[],
): void {
  let exempt = false

  for (const child of node.children) {
    if (ts.isJsxExpression(child) && !child.expression) {
      if (child.getText(source).includes('i18n-exempt:')) {
        exempt = true
      }
      continue
    }

    if (ts.isJsxText(child)) {
      const trimmed = child.text.trim()
      if (!trimmed) {
        continue // whitespace-only text between children never resets `exempt`
      }
      if (isUserFacingText(trimmed) && !exempt) {
        findings.push({ file, line: lineOf(child, source), text: trimmed })
      }
      exempt = false
      continue
    }

    if (ts.isJsxExpression(child) && child.expression) {
      const text = stringLiteralText(child.expression)
      if (text !== null && isUserFacingText(text) && !exempt) {
        findings.push({ file, line: lineOf(child, source), text })
      }
      exempt = false
    }
  }
}

function checkJsxAttribute(
  node: ts.JsxAttribute,
  source: ts.SourceFile,
  file: string,
  findings: LiteralFinding[],
): void {
  if (!EXEMPT_ATTRIBUTES.has(node.name.getText(source))) {
    return
  }
  const initializer = node.initializer
  const text =
    initializer && ts.isStringLiteral(initializer)
      ? initializer.text
      : initializer && ts.isJsxExpression(initializer) && initializer.expression
        ? stringLiteralText(initializer.expression)
        : null
  if (text !== null && isUserFacingText(text)) {
    findings.push({ file, line: lineOf(node, source), text })
  }
}

/**
 * Walks TSX source with the TypeScript compiler API (REQ-I18N-3) and flags
 * every user-facing JSX text literal, literal-string JSX expression child,
 * and literal `title`/`aria-label`/`placeholder`/`alt`/`aria-description`/
 * `aria-roledescription` attribute. UI copy must come from `t()`. Kept
 * inline in this test file (no separate production module) per the
 * design's "node:fs + TypeScript compiler API, zero deps" testing strategy.
 */
function findLiterals(sources: SourceFile[]): LiteralFinding[] {
  const findings: LiteralFinding[] = []

  for (const { file, text } of sources) {
    const source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )

    const visit = (node: ts.Node): void => {
      if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
        checkJsxChildren(node, source, file, findings)
      } else if (ts.isJsxAttribute(node)) {
        checkJsxAttribute(node, source, file, findings)
      }
      ts.forEachChild(node, visit)
    }

    visit(source)
  }

  return findings
}

const fixtureWithJsxText = [
  {
    file: 'Example.tsx',
    text: 'export const Example = () => <div>Hello</div>',
  },
]

describe('findLiterals', () => {
  it('flags a JSX text literal containing a letter', () => {
    expect(findLiterals(fixtureWithJsxText)).toEqual([
      { file: 'Example.tsx', line: 1, text: 'Hello' },
    ])
  })

  it('flags a literal string rendered via a JSX expression', () => {
    const source = [
      {
        file: 'Example.tsx',
        text: 'export const E = () => <div>{"Hello"}</div>',
      },
    ]

    expect(findLiterals(source)).toEqual([
      { file: 'Example.tsx', line: 1, text: 'Hello' },
    ])
  })

  it('flags a literal aria-label attribute', () => {
    const source = [
      {
        file: 'Example.tsx',
        text: 'export const E = () => <button aria-label="Close" />',
      },
    ]

    expect(findLiterals(source)).toEqual([
      { file: 'Example.tsx', line: 1, text: 'Close' },
    ])
  })

  it('does not flag punctuation-only or numeric-only JSX text', () => {
    const source = [
      {
        file: 'Example.tsx',
        text: 'export const E = () => <span>· 42% ·</span>',
      },
    ]

    expect(findLiterals(source)).toEqual([])
  })

  it('does not flag text preceded by an i18n-exempt comment', () => {
    const source = [
      {
        file: 'Example.tsx',
        text: 'export const E = () => (\n  <span>\n    {/* i18n-exempt: unit symbol */}\n    kWh\n  </span>\n)',
      },
    ]

    expect(findLiterals(source)).toEqual([])
  })

  it('does not flag an expression that is not a string literal', () => {
    const source = [
      {
        file: 'Example.tsx',
        text: 'export const E = ({ label }) => <div>{label}</div>',
      },
    ]

    expect(findLiterals(source)).toEqual([])
  })
})

// REQ-I18N-3: no user-facing JSX text literal, and no literal
// title/aria-label/placeholder/alt/aria-description/aria-roledescription,
// may exist under the scanned directories. Scope starts at the shared
// design system; each feature's `components/` directory and `src/pages`
// are added here only once that surface is restyled to `t()` calls (see
// apply-progress -- legacy components/pages are still full of literals).
const SCANNED_ROOTS = ['src/shared/design-system']

describe('no-literal contract', () => {
  it('finds zero user-facing literals under the scanned roots', () => {
    const sources = collectSourceFiles(SCANNED_ROOTS, '.tsx')

    expect(findLiterals(sources)).toEqual([])
  })
})
