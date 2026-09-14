import { useState, type FormEvent } from 'react'

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
      <div className="flex flex-col gap-1">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-red-500">
          {errorMessage}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        Log in
      </button>
    </form>
  )
}
