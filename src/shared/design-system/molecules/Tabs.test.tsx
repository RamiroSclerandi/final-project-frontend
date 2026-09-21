import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Tabs } from './Tabs'

function renderTabs() {
  return render(
    <Tabs defaultValue="unassigned" label="Admin sections">
      <Tabs.List>
        <Tabs.Item value="unassigned">Unassigned</Tabs.Item>
        <Tabs.Item value="clients">Clients</Tabs.Item>
        <Tabs.Item value="users">Users</Tabs.Item>
      </Tabs.List>
      <Tabs.Panel value="unassigned">Unassigned panel</Tabs.Panel>
      <Tabs.Panel value="clients">Clients panel</Tabs.Panel>
      <Tabs.Panel value="users">Users panel</Tabs.Panel>
    </Tabs>,
  )
}

describe('Tabs', () => {
  it('names the tablist so screen readers announce what the tabs switch', () => {
    renderTabs()

    expect(
      screen.getByRole('tablist', { name: 'Admin sections' }),
    ).toBeInTheDocument()
  })

  it('selects a tab on click and shows only its panel (REQ-ADMIN-2)', () => {
    renderTabs()

    expect(screen.getByText('Unassigned panel')).toBeInTheDocument()
    expect(screen.queryByText('Clients panel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Clients' }))

    expect(screen.getByText('Clients panel')).toBeInTheDocument()
    expect(screen.queryByText('Unassigned panel')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Clients' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  // REQ-ADMIN-3: ArrowRight moves focus and selection to the next tab.
  it('moves selection to the next tab on ArrowRight', () => {
    renderTabs()

    screen.getByRole('tab', { name: 'Unassigned' }).focus()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })

    expect(screen.getByText('Clients panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Clients' })).toHaveFocus()
  })

  it('moves selection to the previous tab on ArrowLeft', () => {
    renderTabs()

    screen.getByRole('tab', { name: 'Clients' }).focus()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })

    expect(screen.getByText('Unassigned panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unassigned' })).toHaveFocus()
  })

  it('wraps around from the first tab to the last one on ArrowLeft', () => {
    renderTabs()

    screen.getByRole('tab', { name: 'Unassigned' }).focus()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })

    expect(screen.getByText('Users panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Users' })).toHaveFocus()
  })

  it('wraps around from the last tab to the first on ArrowRight', () => {
    renderTabs()

    screen.getByRole('tab', { name: 'Users' }).focus()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })

    expect(screen.getByText('Unassigned panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Unassigned' })).toHaveFocus()
  })
})
