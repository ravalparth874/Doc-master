/** Custom 404 page for unknown routes. */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass, Home } from 'lucide-react'

import { Seo } from '../components/Seo'
import { TOOL_LINKS } from '../lib/routes'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <>
      <Seo
        title="Page Not Found (404) | DOC Master"
        description="The page you were looking for does not exist. Go back to DOC Master and use our free PDF tools."
        path="/404"
        noIndex
      />

      <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-12 text-center sm:py-16">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
          <Compass aria-hidden="true" size={30} />
        </span>
        <p className="mt-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          {t('notFound.title')}
        </h1>
        <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">{t('notFound.body')}</p>

        <Link to="/" className="btn-primary mt-6 w-full sm:w-auto">
          <Home aria-hidden="true" size={18} />
          {t('notFound.cta')}
        </Link>

        <nav aria-label={t('nav.tools')} className="mt-10 w-full max-w-3xl">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('nav.tools')}</h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {TOOL_LINKS.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="btn-secondary w-full py-1.5 text-xs sm:w-auto">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
