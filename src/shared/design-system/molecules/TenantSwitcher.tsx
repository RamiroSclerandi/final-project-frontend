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
 *
 * Slot contract: AppShell renders this as-is, so the switcher owns its own
 * responsive visibility and must stay reachable on mobile when interactive.
 */
export function TenantSwitcher({
  tenants,
  current,
  onChange,
  label,
}: TenantSwitcherProps) {
  if (tenants.length === 1) {
    return (
      // Only the static single-tenant label hides below md; a real switcher stays reachable on mobile.
      <span className="hidden min-w-0 truncate font-mono text-xs text-text-muted md:inline-block">
        <VisuallyHidden>{label}</VisuallyHidden>
        {current.name}
      </span>
    )
  }

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-label text-text-muted">
      {label}
      <select
        value={current.id}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border-strong bg-sunken px-2 text-base normal-case tracking-normal text-text md:min-h-9 md:text-sm"
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
