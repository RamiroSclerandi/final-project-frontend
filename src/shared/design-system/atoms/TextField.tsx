export interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number'
  autoComplete?: string
  name?: string
  required?: boolean
  error?: string
}

/** A labeled text input; the error, when present, is a persistent `role="alert"` tied via `aria-describedby`. */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  name,
  required,
  error,
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="min-h-11 rounded-md border border-border bg-surface px-3 text-base text-text focus:border-accent"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
