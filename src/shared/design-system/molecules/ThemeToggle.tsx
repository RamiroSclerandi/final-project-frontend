import { useTranslation } from '../../i18n/useTranslation'
import { VisuallyHidden } from '../atoms/VisuallyHidden'
import type { Theme } from '../theme/ThemeContext'

export interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

function ThemeToggleIcon({ theme }: { theme: Theme }) {
  if (theme === 'light') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </svg>
    )
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M8 1a7 7 0 1 0 7 7 5.5 5.5 0 0 1-7-7Z" />
    </svg>
  )
}

/** REQ-DT-2 companion control: toggles the active theme, icon-only with a translated accessible name. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-pressed={theme === 'light'}
      onClick={onToggle}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text md:h-9 md:w-9"
    >
      <ThemeToggleIcon theme={theme} />
      <VisuallyHidden>{t('shell.theme.toggle')}</VisuallyHidden>
    </button>
  )
}
