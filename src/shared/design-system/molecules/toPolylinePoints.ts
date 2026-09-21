const VIEWBOX_WIDTH = 100
const VIEWBOX_HEIGHT = 24
const FLAT_SERIES_Y = VIEWBOX_HEIGHT / 2

/**
 * Normalizes a value series into `"x,y"` pairs inside a 100x24 SVG viewBox
 * for `Sparkline`, flipping y so higher values sit near the top. A single
 * value or a flat series (zero range) renders as a horizontal centered line.
 */
export function toPolylinePoints(values: number[]): string {
  if (values.length === 0) {
    return ''
  }
  if (values.length === 1) {
    return `0.00,${FLAT_SERIES_Y.toFixed(2)} ${VIEWBOX_WIDTH.toFixed(2)},${FLAT_SERIES_Y.toFixed(2)}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const stepX = VIEWBOX_WIDTH / (values.length - 1)

  return values
    .map((value, index) => {
      const x = index * stepX
      const y =
        range === 0
          ? FLAT_SERIES_Y
          : VIEWBOX_HEIGHT - ((value - min) / range) * VIEWBOX_HEIGHT
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}
