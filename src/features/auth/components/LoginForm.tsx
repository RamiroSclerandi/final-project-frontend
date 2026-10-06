import { useState, type FormEvent } from 'react'

import {
  TelemetryIcon,
  WarningIcon,
} from '../../../shared/design-system/atoms/icons'
import { Button } from '../../../shared/design-system/atoms/Button'
import { TextField } from '../../../shared/design-system/atoms/TextField'
import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  isSubmitting: boolean
  errorMessage: string | null
}

/**
 * Presentational login form: email + password only. There is no signup link
 * or route here — self-registration is closed (REQ-AUTH-1) and this
 * component has no way to imply it exists.
 */
export function LoginForm({
  onSubmit,
  isSubmitting,
  errorMessage,
}: LoginFormProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(email, password)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-md border border-border bg-surface p-6">
      <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-label text-text">
        <span className="text-accent">
          <TelemetryIcon className="h-5 w-5" />
        </span>
        {t('shell.brand')}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="login-email"
          label={t('auth.login.email')}
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={setEmail}
          required
        />
        <TextField
          id="login-password"
          label={t('auth.login.password')}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        {errorMessage && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-danger bg-danger-soft p-3 text-sm text-danger"
          >
            <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </p>
        )}
        <div className="flex flex-col [&>button]:w-full">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {t('auth.login.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
