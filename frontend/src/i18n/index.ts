/**
 * i18n bootstrap.
 *
 * English, Hindi and Gujarati ship with the app. The active language is stored
 * in `localStorage` (when a browser is available) and mirrored onto the
 * `lang` attribute of the document so screen readers and search engines pick
 * the right language.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import gu from './locales/gu.json'
import hi from './locales/hi.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const STORAGE_KEY = 'doc-master-language'

function readStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return 'en'
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LANGUAGES.some((language) => language.code === stored)) {
      return stored as LanguageCode
    }
    const browser = window.navigator.language.slice(0, 2)
    const match = SUPPORTED_LANGUAGES.find((language) => language.code === browser)
    return match ? match.code : 'en'
  } catch {
    return 'en'
  }
}

export function applyDocumentLanguage(language: string): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.lang = language
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    gu: { translation: gu },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
})

applyDocumentLanguage(i18n.language)

export default i18n
