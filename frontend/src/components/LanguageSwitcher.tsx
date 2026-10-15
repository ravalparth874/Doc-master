/** Language picker for English, Hindi and Gujarati. */

import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

import { SUPPORTED_LANGUAGES, STORAGE_KEY, applyDocumentLanguage } from '../i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const change = (code: string) => {
    void i18n.changeLanguage(code)
    applyDocumentLanguage(code)
    try {
      window.localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // Storage can be unavailable; the choice still applies for this visit.
    }
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t('language.label')}</span>
      <Languages
        aria-hidden="true"
        size={18}
        className="pointer-events-none absolute left-2.5 text-slate-500 dark:text-slate-400"
      />
      <select
        value={i18n.language.startsWith('hi') ? 'hi' : i18n.language.startsWith('gu') ? 'gu' : 'en'}
        onChange={(event) => change(event.target.value)}
        className="min-h-11 cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  )
}
