/** RGB channel triplet in the 0-255 range. */
interface Rgb {
  r: number
  g: number
  b: number
}

function parseHex(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : normalized
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  }
}

/** Converts an sRGB 0-255 channel to linear light, per the WCAG formula. */
function toLinearChannel(channel: number): number {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex)
  return (
    0.2126 * toLinearChannel(r) +
    0.7152 * toLinearChannel(g) +
    0.0722 * toLinearChannel(b)
  )
}

/**
 * WCAG contrast ratio between two sRGB hex colors, from 1:1 (identical) to
 * 21:1 (black on white). Order of arguments does not matter.
 */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const lighter = Math.max(relativeLuminance(fgHex), relativeLuminance(bgHex))
  const darker = Math.min(relativeLuminance(fgHex), relativeLuminance(bgHex))
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Extracts `--token: #hex;` custom-property pairs from the `[data-theme]`
 * blocks in `src/index.css` (D6) -- the stylesheet is the single source of
 * truth for token values, so the contrast test reads it directly instead of
 * duplicating colors in a TS fixture.
 */
export function parseThemeTokens(
  css: string,
): Record<'dark' | 'light', Record<string, string>> {
  const tokens: Record<'dark' | 'light', Record<string, string>> = {
    dark: {},
    light: {},
  }

  const blockPattern = /\[data-theme=['"](dark|light)['"]\]\s*\{([^}]*)\}/g
  for (const match of css.matchAll(blockPattern)) {
    const theme = match[1]
    const body = match[2]
    if ((theme !== 'dark' && theme !== 'light') || body === undefined) {
      continue
    }

    const declarationPattern = /--([\w-]+):\s*([^;]+);/g
    for (const declaration of body.matchAll(declarationPattern)) {
      const name = declaration[1]
      const value = declaration[2]
      if (name === undefined || value === undefined) {
        continue
      }
      tokens[theme][name] = value.trim()
    }
  }

  return tokens
}
