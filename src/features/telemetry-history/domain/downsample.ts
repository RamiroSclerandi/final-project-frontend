import type { HistoricalPoint } from './historicalPoint'

/** Indices here are always kept in bounds by the bucket math below. */
function at(
  points: readonly HistoricalPoint[],
  index: number,
): HistoricalPoint {
  const point = points[index]
  if (!point) {
    throw new RangeError(`downsampleLTTB: index ${index} is out of bounds`)
  }
  return point
}

function timeOf(historicalPoint: HistoricalPoint): number {
  return Date.parse(historicalPoint.t)
}

/**
 * Largest-Triangle-Three-Buckets downsampling, applied only at the chart
 * render boundary (REQ-HS-4). Never touches CSV export or staleness
 * detection, which both read the raw series directly.
 */
export function downsampleLTTB(
  points: readonly HistoricalPoint[],
  threshold: number,
): HistoricalPoint[] {
  const pointCount = points.length
  if (pointCount < 3 || pointCount <= threshold) {
    return [...points]
  }
  if (threshold < 3) {
    return [at(points, 0), at(points, pointCount - 1)]
  }

  const sampled: HistoricalPoint[] = [at(points, 0)]
  const bucketSize = (pointCount - 2) / (threshold - 2)
  let selectedIndex = 0

  for (let bucket = 0; bucket < threshold - 2; bucket += 1) {
    const avgRangeStart = Math.floor((bucket + 1) * bucketSize) + 1
    const avgRangeEnd = Math.min(
      Math.floor((bucket + 2) * bucketSize) + 1,
      pointCount,
    )
    let avgX = 0
    let avgY = 0
    for (let i = avgRangeStart; i < avgRangeEnd; i += 1) {
      avgX += timeOf(at(points, i))
      avgY += at(points, i).value
    }
    const avgRangeLength = avgRangeEnd - avgRangeStart
    avgX /= avgRangeLength
    avgY /= avgRangeLength

    const rangeStart = Math.floor(bucket * bucketSize) + 1
    const rangeEnd = Math.floor((bucket + 1) * bucketSize) + 1
    const pointA = at(points, selectedIndex)
    const pointAX = timeOf(pointA)
    const pointAY = pointA.value

    let maxArea = -1
    let maxAreaIndex = rangeStart
    for (let i = rangeStart; i < rangeEnd; i += 1) {
      const candidate = at(points, i)
      const area = Math.abs(
        (pointAX - avgX) * (candidate.value - pointAY) -
          (pointAX - timeOf(candidate)) * (avgY - pointAY),
      )
      if (area > maxArea) {
        maxArea = area
        maxAreaIndex = i
      }
    }

    sampled.push(at(points, maxAreaIndex))
    selectedIndex = maxAreaIndex
  }

  sampled.push(at(points, pointCount - 1))
  return sampled
}
