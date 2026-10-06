import {
  createContext,
  use,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

interface TabsContextValue {
  selected: string
  select: (value: string) => void
  idPrefix: string
  label: string
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabsContext(caller: string): TabsContextValue {
  const context = use(TabsContext)
  if (!context) {
    throw new Error(`${caller} must be used within Tabs`)
  }
  return context
}

export interface TabsProps {
  defaultValue: string
  label: string
  children: ReactNode
}

/**
 * ARIA tabs pattern compound component (REQ-ADMIN-2, REQ-ADMIN-3):
 * `Tabs` owns the selected value, `Tabs.List` provides roving-tabindex
 * arrow-key navigation, `Tabs.Item`/`Tabs.Panel` read the shared context.
 */
export function Tabs({ defaultValue, label, children }: TabsProps) {
  const [selected, setSelected] = useState(defaultValue)
  const idPrefix = useId()

  return (
    <TabsContext.Provider
      value={{ selected, select: setSelected, idPrefix, label }}
    >
      {children}
    </TabsContext.Provider>
  )
}

function moveSelectionOnArrowKey(event: KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
    return
  }
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  )
  const currentIndex = tabs.findIndex((tab) => tab === document.activeElement)
  if (currentIndex === -1) {
    return
  }
  const delta = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex = (currentIndex + delta + tabs.length) % tabs.length
  const nextTab = tabs[nextIndex]
  if (!nextTab) {
    return
  }
  nextTab.focus()
  nextTab.click()
}

Tabs.List = function TabsList({ children }: { children: ReactNode }) {
  const { label } = useTabsContext('Tabs.List')
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={moveSelectionOnArrowKey}
      className="flex gap-1 border-b border-border"
    >
      {children}
    </div>
  )
}

interface TabsValueProps {
  value: string
  children: ReactNode
}

Tabs.Item = function TabsItem({ value, children }: TabsValueProps) {
  const { selected, select, idPrefix } = useTabsContext('Tabs.Item')
  const isSelected = selected === value

  return (
    <button
      type="button"
      role="tab"
      id={`${idPrefix}-tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`${idPrefix}-panel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => select(value)}
      className={`-mb-px min-h-11 border-b-2 px-4 text-xs font-medium uppercase tracking-label md:min-h-9 ${isSelected ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text'}`}
    >
      {children}
    </button>
  )
}

Tabs.Panel = function TabsPanel({ value, children }: TabsValueProps) {
  const { selected, idPrefix } = useTabsContext('Tabs.Panel')
  if (selected !== value) {
    return null
  }

  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
    >
      {children}
    </div>
  )
}
