import { Button } from '../../../shared/design-system/atoms/Button'
import { useTranslation } from '../../../shared/i18n/useTranslation'

export interface LogoutButtonProps {
  onLogout: () => void
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { t } = useTranslation()

  return (
    <Button type="button" variant="secondary" onClick={onLogout}>
      {t('shell.logout')}
    </Button>
  )
}
