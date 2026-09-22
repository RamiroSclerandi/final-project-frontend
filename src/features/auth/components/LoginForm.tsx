import { useState, type FormEvent } from 'react'

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
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
    >
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
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      )}
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {t('auth.login.submit')}
      </Button>
    </form>
  )
}
