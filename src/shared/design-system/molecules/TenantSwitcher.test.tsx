import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TenantSwitcher } from './TenantSwitcher'

const CAMPUS = { id: 'tenant-1', name: 'UNRaf - Campus Central' }
const LABORATORY = { id: 'tenant-2', name: 'UNRaf - Laboratorios' }

describe('TenantSwitcher', () => {
  it('renders a single tenant as plain text, with no control to operate (REQ-SHELL-4)', () => {
    render(
      <TenantSwitcher
        tenants={[CAMPUS]}
        current={CAMPUS}
        onChange={vi.fn()}
        label="Client"
      />,
    )

    expect(screen.getByText(CAMPUS.name)).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
    // The label has to reach assistive technology some other way, since a
    // role-less element drops aria-label.
    expect(screen.getByText('Client')).toBeInTheDocument()
  })

  it('renders a select once more than one tenant exists (REQ-SHELL-4)', () => {
    render(
      <TenantSwitcher
        tenants={[CAMPUS, LABORATORY]}
        current={CAMPUS}
        onChange={vi.fn()}
        label="Client"
      />,
    )

    const select = screen.getByRole('combobox', { name: 'Client' })

    expect(select).toHaveValue(CAMPUS.id)
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('reports the chosen tenant id to the caller', () => {
    const onChange = vi.fn()
    render(
      <TenantSwitcher
        tenants={[CAMPUS, LABORATORY]}
        current={CAMPUS}
        onChange={onChange}
        label="Client"
      />,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Client' }), {
      target: { value: LABORATORY.id },
    })

    expect(onChange).toHaveBeenCalledWith(LABORATORY.id)
  })
})
