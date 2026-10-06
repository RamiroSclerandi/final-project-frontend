import type { Locale } from '../../i18n/dictionary'
import { useTranslation } from '../../i18n/useTranslation'

export interface LocaleToggleProps {
  locale: Locale
  onChange: (locale: Locale) => void
}

/** REQ-I18N-5: accessible locale switch, each option carrying its own `lang`. */
export function LocaleToggle({ locale, onChange }: LocaleToggleProps) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('shell.locale.label')}
      className="inline-flex gap-1"
    >
      <button
        type="button"
        lang="es"
        aria-pressed={locale === 'es'}
        onClick={() => onChange('es')}
        className="min-h-11 rounded-md px-2 font-mono text-xs uppercase tracking-label text-text-muted hover:text-text aria-pressed:bg-surface-raised aria-pressed:text-text md:min-h-9"
      >
        {t('shell.locale.es')}
      </button>
      <button
        type="button"
        lang="en"
        aria-pressed={locale === 'en'}
        onClick={() => onChange('en')}
        className="min-h-11 rounded-md px-2 font-mono text-xs uppercase tracking-label text-text-muted hover:text-text aria-pressed:bg-surface-raised aria-pressed:text-text md:min-h-9"
      >
        {t('shell.locale.en')}
      </button>
    </div>
  )
}
