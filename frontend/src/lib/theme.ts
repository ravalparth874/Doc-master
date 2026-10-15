/** Colour scheme handling: follows the system preference until the visitor picks one. */

import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'doc-master-theme'

export type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function storedTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : systemTheme()
  } catch {
    return systemTheme()
  }
}

/** Apply the theme class to the document root. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export interface ThemeController {
  theme: Theme
  toggleTheme: () => void
}

export function useTheme(): ThemeController {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const initial = storedTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Storage can be unavailable in private mode; the theme still applies.
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
