import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { rssiToBars } from '../../../features/node/domain/rssiToBars'
import { SignalBars } from './SignalBars'

function filledBarCount(container: HTMLElement): number {
  return container.querySelectorAll('.bg-accent').length
}

function unfilledBarCount(container: HTMLElement): number {
  return container.querySelectorAll('.bg-border').length
}

describe('SignalBars', () => {
  it('pairs the signal text with a decorative glyph at full strength', () => {
    render(<SignalBars bars={4} label="Strong signal" />)

    expect(screen.getByText('Strong signal')).toBeInTheDocument()
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })

  // PR-2 debt: partial fill (1, 2, 3 bars) had no assertion.
  it.each([
    [1, 1, 3],
    [2, 2, 2],
    [3, 3, 1],
  ])(
    'renders %i filled bar(s) out of 4 for bars=%i',
    (bars, filled, unfilled) => {
      const { container } = render(
        <SignalBars bars={bars as 1 | 2 | 3} label="Signal" />,
      )

      expect(filledBarCount(container)).toBe(filled)
      expect(unfilledBarCount(container)).toBe(unfilled)
    },
  )

  // D12: rssi === null -> rssiToBars returns 0 -> the "unknown" variant,
  // which must still carry visible text, never a bare empty glyph.
  it('renders the unknown variant with visible text when bars is 0', () => {
    render(<SignalBars bars={0} label="Unknown" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  // PR-2 debt: this test used a literal 0, decoupled from the real fallback
  // function. Now that rssiToBars exists (node domain, D12), feed its actual
  // output through so the D12 fallback path is proven end to end.
  it('keeps rendering the unknown variant with text when fed rssiToBars(null) (D12)', () => {
    render(<SignalBars bars={rssiToBars(null)} label="Unknown" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(document.querySelectorAll('.bg-accent')).toHaveLength(0)
  })
})
