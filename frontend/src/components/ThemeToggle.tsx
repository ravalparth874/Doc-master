/** Dark mode switch, initialised from localStorage or the system preference. */

import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../lib/theme'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? t('theme.light') : t('theme.dark')

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="btn-ghost btn-icon"
      aria-label={t('theme.toggle')}
      title={nextTheme}
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" size={20} />
      ) : (
        <Moon aria-hidden="true" size={20} />
      )}
    </button>
  )
}
