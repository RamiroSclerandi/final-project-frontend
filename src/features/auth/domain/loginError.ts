const GENERIC_LOGIN_ERROR_MESSAGE = 'Invalid email or password.'

/**
 * Maps any login failure — Supabase auth error, network failure, or anything
 * else — to one fixed, generic message. The caller's raw error text is never
 * echoed back to the user: it could reveal whether an account exists or leak
 * internal detail.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the input is deliberately ignored; every error maps to the same generic message
export function toSafeLoginErrorMessage(_error: unknown): string {
  return GENERIC_LOGIN_ERROR_MESSAGE
}
