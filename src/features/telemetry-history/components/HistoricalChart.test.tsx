import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import type { HistoricalPoint } from '../domain/historicalPoint'
import {
  CHART_POINT_BUDGET,
  HistoricalChart,
  HistoricalTooltip,
} from './HistoricalChart'

const basePoints: HistoricalPoint[] = [
  { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
  { t: '2026-09-15T10:00:00Z', value: 21, quality: 'out_of_range' },
  { t: '2026-09-15T11:00:00Z', value: 22, min: 21, max: 23, partial: true },
  { t: '2026-09-15T11:30:00Z', value: 19, quality: 'ok', tsSource: 'server' },
]

/** X coordinates of the line's vertices (each segment's endpoint), in drawing order. */
function linePathXs(container: HTMLElement): number[] {
  const d =
    container.querySelector('.recharts-line-curve')?.getAttribute('d') ?? ''
  return Array.from(d.matchAll(/[MLC]([^MLC]*)/g), (match) => {
    const numbers = (match[1] ?? '').split(/[\s,]+/).filter(Boolean)
    return Number(numbers.at(-2))
  })
}

describe('HistoricalChart', () => {
  it('shows a loading message', () => {
    renderWithProviders(<HistoricalChart points={[]} isLoading />)
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument()
  })

  it('shows the empty-range message when no point has a usable timestamp', () => {
    renderWithProviders(
      <HistoricalChart
        points={[{ t: 'not-a-date', value: 20, quality: 'ok' }]}
        isLoading={false}
      />,
    )
    expect(screen.getByText(/no data for this range/i)).toBeInTheDocument()
  })

  it('shows an empty-range message when there are no points', () => {
    renderWithProviders(<HistoricalChart points={[]} isLoading={false} />)
    expect(screen.getByText(/no data for this range/i)).toBeInTheDocument()
  })

  it('renders the series without throwing', () => {
    const { container } = renderWithProviders(
      <HistoricalChart points={basePoints} isLoading={false} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('mounts inside a ResponsiveContainer that fills its container width (REQ-SENSOR-1, REQ-HS-4)', () => {
    const { container } = renderWithProviders(
      <HistoricalChart points={basePoints} isLoading={false} />,
    )
    expect(
      container.querySelector('.recharts-responsive-container'),
    ).not.toBeNull()
  })

  it('marks out-of-range, partial, and clock-unsynced points, never hiding them (D-7)', () => {
    renderWithProviders(
      <HistoricalChart points={basePoints} isLoading={false} />,
    )
    const marked = screen.getAllByRole('img')
    expect(marked).toHaveLength(3)
    expect(
      marked.some((el) =>
        /out of range/i.test(el.getAttribute('aria-label') ?? ''),
      ),
    ).toBe(true)
    expect(
      marked.some((el) => /partial/i.test(el.getAttribute('aria-label') ?? '')),
    ).toBe(true)
    expect(
      marked.some((el) =>
        /clock unsynced/i.test(el.getAttribute('aria-label') ?? ''),
      ),
    ).toBe(true)
  })

  it('drops a point whose timestamp does not parse and still draws the rest', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
      { t: 'not-a-date', value: 99, quality: 'ok' },
      { t: '2026-09-15T10:00:00Z', value: 21, quality: 'ok' },
      { t: '2026-09-15T11:00:00Z', value: 22, quality: 'ok' },
    ]
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
    expect(linePathXs(container)).toHaveLength(3)
  })

  it('does not start the Y axis at zero when values sit well above it', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T10:00:00Z', value: 21, quality: 'ok' },
      { t: '2026-09-15T11:00:00Z', value: 22, quality: 'ok' },
    ]
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} />,
    )
    const yAxisTicks = Array.from(
      container.querySelectorAll(
        '.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value',
      ),
    ).map((el) => el.textContent)
    expect(yAxisTicks.length).toBeGreaterThan(0)
    expect(yAxisTicks).not.toContain('0')
  })

  it('places points by time, so a data gap keeps its real width', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T09:10:00Z', value: 21, quality: 'ok' },
      { t: '2026-09-15T10:30:00Z', value: 22, quality: 'ok' },
    ]
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} />,
    )
    const xs = linePathXs(container)
    expect(xs).toHaveLength(3)
    // 10 of 90 minutes: a category axis would put the middle point halfway.
    const [x0 = NaN, x1 = NaN, x2 = NaN] = xs
    expect((x1 - x0) / (x2 - x0)).toBeCloseTo(10 / 90, 2)
  })

  it('spans the requested window even where it holds no data', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T10:00:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T11:00:00Z', value: 21, quality: 'ok' },
    ]
    const domain: [number, number] = [
      Date.parse('2026-09-15T09:00:00Z'),
      Date.parse('2026-09-15T11:00:00Z'),
    ]
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} domain={domain} />,
    )
    const [first = NaN, last = NaN] = linePathXs(container)
    const axisLine = container.querySelector('.recharts-xAxis line')
    const axisStart = Number(axisLine?.getAttribute('x1'))
    const axisEnd = Number(axisLine?.getAttribute('x2'))
    expect((first - axisStart) / (axisEnd - axisStart)).toBeCloseTo(0.5, 2)
    expect(last).toBeCloseTo(axisEnd, 0)
  })

  it('spaces the time ticks evenly across the window, not at data points', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T09:05:00Z', value: 21, quality: 'ok' },
      { t: '2026-09-15T11:00:00Z', value: 22, quality: 'ok' },
    ]
    const domain: [number, number] = [
      Date.parse('2026-09-15T09:00:00Z'),
      Date.parse('2026-09-15T11:00:00Z'),
    ]
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} domain={domain} />,
    )
    const tickXs = Array.from(
      container.querySelectorAll(
        '.recharts-xAxis .recharts-cartesian-axis-tick-line',
      ),
      (line) => Number(line.getAttribute('x1')),
    )
    expect(tickXs.length).toBeGreaterThanOrEqual(4)
    const gaps = tickXs.slice(1).map((x, index) => x - (tickXs[index] ?? NaN))
    for (const gap of gaps) {
      expect(gap).toBeCloseTo(gaps[0] ?? NaN, 0)
    }
  })

  it('renders a 5,000-point raw series without throwing (REQ-HS-4)', () => {
    const points: HistoricalPoint[] = Array.from({ length: 5000 }, (_, i) => ({
      t: new Date(Date.UTC(2026, 8, 15) + i * 15_000).toISOString(),
      value: 20 + (i % 3),
      quality: 'ok',
    }))
    const t0 = performance.now()
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} />,
    )
    const elapsedMs = performance.now() - t0
    expect(container.querySelector('svg')).not.toBeNull()
    console.info(
      `HistoricalChart REQ-HS-4: mounted 5000 points in ${elapsedMs.toFixed(1)}ms`,
    )
  })

  it('downsamples the densest in-scope range (24h raw at 15s) to stay within the chart point budget (REQ-HS-4, D-8)', () => {
    const densestRawPointCount = (24 * 60 * 60) / 15
    expect(densestRawPointCount).toBe(5760)
    expect(densestRawPointCount).toBeGreaterThan(CHART_POINT_BUDGET)

    const points: HistoricalPoint[] = Array.from(
      { length: densestRawPointCount },
      (_, i) => ({
        t: new Date(Date.UTC(2026, 8, 15) + i * 15_000).toISOString(),
        value: 20 + (i % 3),
        quality: 'ok',
      }),
    )
    const { container } = renderWithProviders(
      <HistoricalChart points={points} isLoading={false} />,
    )
    const linePath = container.querySelector('.recharts-line-curve')
    expect(linePath).not.toBeNull()
    const segmentCount =
      (linePath?.getAttribute('d') ?? '').split(/[LC]/).length - 1
    expect(segmentCount).toBeLessThanOrEqual(CHART_POINT_BUDGET)
  })
})

describe('HistoricalTooltip', () => {
  it('shows the sample count when the hovered point carries one', () => {
    renderWithProviders(
      <HistoricalTooltip
        active
        payload={[
          {
            payload: { t: '2026-09-15T11:00:00Z', value: 22, sampleCount: 12 },
          },
        ]}
      />,
    )
    expect(screen.getByText(/mean of 12 samples/i)).toBeInTheDocument()
  })

  it('omits the sample-count line for a raw point', () => {
    renderWithProviders(
      <HistoricalTooltip
        active
        payload={[{ payload: { t: '2026-09-15T11:00:00Z', value: 22 } }]}
      />,
    )
    expect(screen.queryByText(/mean of/i)).not.toBeInTheDocument()
  })

  it('renders nothing when inactive', () => {
    const { container } = renderWithProviders(
      <HistoricalTooltip active={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the hovered value with its unit and a local timestamp, never raw ISO', () => {
    renderWithProviders(
      <HistoricalTooltip
        active
        unit="degC"
        payload={[{ payload: { t: '2026-09-15T11:00:00Z', value: 22.25 } }]}
      />,
    )

    expect(screen.getByText('22.25 °C')).toBeInTheDocument()
    expect(screen.queryByText('2026-09-15T11:00:00Z')).not.toBeInTheDocument()
  })
})
