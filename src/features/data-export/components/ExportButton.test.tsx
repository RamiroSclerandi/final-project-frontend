import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { ExportButton } from './ExportButton'

describe('ExportButton', () => {
  it('calls onExport when clicked', () => {
    const onExport = vi.fn()
    renderWithProviders(
      <ExportButton onExport={onExport} isExporting={false} error={null} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))

    expect(onExport).toHaveBeenCalledOnce()
  })

  it('disables the button and shows progress while exporting', () => {
    renderWithProviders(
      <ExportButton onExport={vi.fn()} isExporting={true} error={null} />,
    )

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent(/exporting/i)
  })

  it('shows the error message when present', () => {
    renderWithProviders(
      <ExportButton
        onExport={vi.fn()}
        isExporting={false}
        error="Could not export the selected range. Try again."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/could not export/i)
  })
})
