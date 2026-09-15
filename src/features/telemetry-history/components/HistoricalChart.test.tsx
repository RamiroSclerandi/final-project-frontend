import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { HistoricalPoint } from '../domain/historicalPoint'
import { HistoricalChart, HistoricalTooltip } from './HistoricalChart'

const basePoints: HistoricalPoint[] = [
  { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
  { t: '2026-09-15T10:00:00Z', value: 21, quality: 'out_of_range' },
  { t: '2026-09-15T11:00:00Z', value: 22, min: 21, max: 23, partial: true },
  { t: '2026-09-15T11:30:00Z', value: 19, quality: 'ok', tsSource: 'server' },
]

describe('HistoricalChart', () => {
  it('shows a loading message', () => {
    render(<HistoricalChart points={[]} isLoading />)
    expect(screen.getByText(/loading chart/i)).toBeInTheDocument()
  })

  it('shows an empty-range message when there are no points', () => {
    render(<HistoricalChart points={[]} isLoading={false} />)
    expect(screen.getByText(/no data for this range/i)).toBeInTheDocument()
  })

  it('renders the series without throwing', () => {
    const { container } = render(
      <HistoricalChart points={basePoints} isLoading={false} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('marks out-of-range, partial, and clock-unsynced points, never hiding them (D-7)', () => {
    render(<HistoricalChart points={basePoints} isLoading={false} />)
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

  it('does not start the Y axis at zero when values sit well above it', () => {
    const points: HistoricalPoint[] = [
      { t: '2026-09-15T09:00:00Z', value: 20, quality: 'ok' },
      { t: '2026-09-15T10:00:00Z', value: 21, quality: 'ok' },
      { t: '2026-09-15T11:00:00Z', value: 22, quality: 'ok' },
    ]
    const { container } = render(
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

  it('renders a 5,000-point raw series without throwing (REQ-HS-4)', () => {
    const points: HistoricalPoint[] = Array.from({ length: 5000 }, (_, i) => ({
      t: new Date(Date.UTC(2026, 8, 15) + i * 15_000).toISOString(),
      value: 20 + (i % 3),
      quality: 'ok',
    }))
    const t0 = performance.now()
    const { container } = render(
      <HistoricalChart points={points} isLoading={false} />,
    )
    const elapsedMs = performance.now() - t0
    expect(container.querySelector('svg')).not.toBeNull()
    console.info(
      `HistoricalChart REQ-HS-4: mounted 5000 points in ${elapsedMs.toFixed(1)}ms`,
    )
  })

  it('the densest in-scope range (24h raw at 15s) exceeds the 5,000-point budget, tracked as a follow-up (D-8)', () => {
    const densestRawPointCount = (24 * 60 * 60) / 15
    expect(densestRawPointCount).toBe(5760)
    expect(densestRawPointCount).toBeGreaterThan(5000)

    const points: HistoricalPoint[] = Array.from(
      { length: densestRawPointCount },
      (_, i) => ({
        t: new Date(Date.UTC(2026, 8, 15) + i * 15_000).toISOString(),
        value: 20 + (i % 3),
        quality: 'ok',
      }),
    )
    const { container } = render(
      <HistoricalChart points={points} isLoading={false} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
  })
})

describe('HistoricalTooltip', () => {
  it('shows the sample count when the hovered point carries one', () => {
    render(
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
    render(
      <HistoricalTooltip
        active
        payload={[{ payload: { t: '2026-09-15T11:00:00Z', value: 22 } }]}
      />,
    )
    expect(screen.queryByText(/mean of/i)).not.toBeInTheDocument()
  })

  it('renders nothing when inactive', () => {
    const { container } = render(<HistoricalTooltip active={false} />)
    expect(container).toBeEmptyDOMElement()
  })
})
