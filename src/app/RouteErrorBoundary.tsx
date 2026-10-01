import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { Button } from '../shared/design-system/atoms/Button'
import { EmptyState } from '../shared/design-system/molecules/EmptyState'
import { useTranslation } from '../shared/i18n/useTranslation'

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  hasError: boolean
}

function CrashedView({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      title={t('common.viewCrashedTitle')}
      body={t('common.viewCrashedBody')}
      action={
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      }
    />
  )
}

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <CrashedView onRetry={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}

/** Contains a render crash to the current route; navigating away resets it. */
export function RouteErrorBoundary({ children }: BoundaryProps) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}
