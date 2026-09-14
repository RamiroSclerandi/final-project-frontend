import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../application/useAuth'
import { LoginForm } from '../components/LoginForm'

/**
 * Wires the login form to `useAuth().signIn`. On success, routes to the
 * dashboard route; on failure, shows the already-generic error message from
 * `useAuth` without any further interpretation.
 */
export function LoginContainer() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(email: string, password: string) {
    setIsSubmitting(true)
    setErrorMessage(null)

    const { error } = await signIn(email, password)

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <LoginForm
      onSubmit={(email, password) => void handleSubmit(email, password)}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
    />
  )
}
