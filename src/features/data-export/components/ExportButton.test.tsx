import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ExportButton } from './ExportButton'

describe('ExportButton', () => {
  it('calls onExport when clicked', () => {
    const onExport = vi.fn()
    render(
      <ExportButton onExport={onExport} isExporting={false} error={null} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }))

    expect(onExport).toHaveBeenCalledOnce()
  })

  it('disables the button and shows progress while exporting', () => {
    render(<ExportButton onExport={vi.fn()} isExporting={true} error={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent(/exporting/i)
  })

  it('shows the error message when present', () => {
    render(
      <ExportButton
        onExport={vi.fn()}
        isExporting={false}
        error="Could not export the selected range. Try again."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/could not export/i)
  })
})
