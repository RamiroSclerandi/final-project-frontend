import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { NodeConfigDrawer } from './NodeConfigDrawer'

describe('NodeConfigDrawer', () => {
  it('calls showModal and renders the dialog open when open is true (REQ-CFG-1)', () => {
    renderWithProviders(
      <NodeConfigDrawer open onClose={vi.fn()} title="Configure Greenhouse A">
        <p>Section content</p>
      </NodeConfigDrawer>,
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('open')
  })

  it('does not open the dialog when open is false', () => {
    renderWithProviders(
      <NodeConfigDrawer
        open={false}
        onClose={vi.fn()}
        title="Configure Greenhouse A"
      >
        <p>Section content</p>
      </NodeConfigDrawer>,
    )

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute(
      'open',
    )
  })

  it('runs the close handler when the dialog fires a native close event', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <NodeConfigDrawer open onClose={onClose} title="Configure Greenhouse A">
        <p>Section content</p>
      </NodeConfigDrawer>,
    )

    fireEvent(screen.getByRole('dialog'), new Event('close'))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('returns focus to the element that opened it once it closes', () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <NodeConfigDrawer
            open={open}
            onClose={() => setOpen(false)}
            title="Configure Greenhouse A"
          >
            <p>Section content</p>
          </NodeConfigDrawer>
        </>
      )
    }

    renderWithProviders(<Harness />)
    const openButton = screen.getByRole('button', { name: 'Open' })
    openButton.focus()
    fireEvent.click(openButton)

    fireEvent(screen.getByRole('dialog'), new Event('close'))

    expect(openButton).toHaveFocus()
  })

  it('renders its children inside the dialog', () => {
    renderWithProviders(
      <NodeConfigDrawer open onClose={vi.fn()} title="Configure Greenhouse A">
        <p>Section content</p>
      </NodeConfigDrawer>,
    )

    expect(screen.getByText('Section content')).toBeInTheDocument()
  })
})
