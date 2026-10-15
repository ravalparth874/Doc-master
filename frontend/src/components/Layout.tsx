/** Page shell: skip link, header, main landmark and footer. */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Footer } from './Footer'
import { Header } from './Header'

export function Layout() {
  const { t } = useTranslation()
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      return
    }
    const target = document.querySelector(hash)
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function PageSpinner() {
  return (
    <div className="container-page flex min-h-[50vh] items-center justify-center" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
