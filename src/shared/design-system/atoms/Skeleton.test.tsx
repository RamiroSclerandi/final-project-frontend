import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders one placeholder line per the requested count', () => {
    const { container } = render(<Skeleton lines={3} />)

    expect(container.querySelectorAll('[aria-hidden="true"] > *')).toHaveLength(
      3,
    )
  })

  it('renders a different number of placeholder lines', () => {
    const { container } = render(<Skeleton lines={1} />)

    expect(container.querySelectorAll('[aria-hidden="true"] > *')).toHaveLength(
      1,
    )
  })
})
