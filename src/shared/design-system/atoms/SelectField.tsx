export interface SelectFieldOption {
  value: string
  label: string
}

export interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: SelectFieldOption[]
  onChange: (value: string) => void
}

/** A labeled `<select>`; options carry their own already-translated label. */
export function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-label text-text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-md border border-border-strong bg-sunken px-3 text-base text-text focus:border-accent md:min-h-9 md:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
