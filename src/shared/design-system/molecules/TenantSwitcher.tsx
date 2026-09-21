import { VisuallyHidden } from '../atoms/VisuallyHidden'

// Structural, not imported from `src/app/tenant.ts` -- PR-2 does not touch
// `src/app/**`. `src/app/tenant.ts` (PR-3) is expected to produce values
// shaped like this.
export interface TenantOption {
  id: string
  name: string
}

export interface TenantSwitcherProps {
  tenants: TenantOption[]
  current: TenantOption
  onChange: (id: string) => void
  label: string
}

/**
 * REQ-SHELL-4: a single tenant renders as a non-interactive label (no
 * listbox role); more than one renders a real `<select>`. Presentational
 * only -- wiring (deriving `tenants`/`current` from the session) lands in
 * PR-3's `AppShellContainer`.
 */
export function TenantSwitcher({
  tenants,
  current,
  onChange,
  label,
}: TenantSwitcherProps) {
  if (tenants.length === 1) {
    return (
      <span className="text-sm text-text">
        <VisuallyHidden>{label}</VisuallyHidden>
        {current.name}
      </span>
    )
  }

  return (
    <label className="flex items-center gap-2 text-sm text-text">
      {label}
      <select
        value={current.id}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border bg-surface px-2 text-text"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  )
}
