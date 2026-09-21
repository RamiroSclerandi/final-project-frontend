import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import type { Theme } from '../design-system/theme/ThemeContext'
import { ThemeProvider } from '../design-system/theme/ThemeProvider'
import type { Locale } from '../i18n/dictionary'
import { I18nProvider } from '../i18n/I18nProvider'

export interface RenderWithProvidersOptions {
  locale?: Locale
  route?: string
  theme?: Theme
  queryClient?: QueryClient
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

/**
 * Renders `ui` wrapped in the app's provider stack (D11): query client,
 * locale, theme, and an in-memory router. Auth is intentionally excluded --
 * tests mock `useAuth`/`AuthProvider` directly, the same pattern already
 * used by `RequireSession.test.tsx`. Defaults to the `en` dictionary and the
 * dark theme so existing English-text assertions keep passing unmodified.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    locale = 'en',
    route = '/',
    theme = 'dark',
    queryClient = createTestQueryClient(),
  }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const result = render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={locale}>
        <ThemeProvider initialTheme={theme}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>,
  )

  return { ...result, queryClient }
}
