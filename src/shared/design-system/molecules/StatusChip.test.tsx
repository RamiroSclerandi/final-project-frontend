import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../test/renderWithProviders'
import { StatusChip } from './StatusChip'

describe('StatusChip', () => {
  it('translates the online status to its English label', () => {
    renderWithProviders(<StatusChip status="online" />)

    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('translates the offline status to its Spanish label', () => {
    renderWithProviders(<StatusChip status="offline" />, { locale: 'es' })

    expect(screen.getByText('Desconectado')).toBeInTheDocument()
  })

  // PR-2 debt: the unknown status was never asserted.
  it('translates the unknown status to its English label', () => {
    renderWithProviders(<StatusChip status="unknown" />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
