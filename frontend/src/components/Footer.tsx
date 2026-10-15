/**
 * Site footer.
 *
 * Three bands: a trust band that repeats the privacy promise, a four column
 * link directory, and a bottom bar with the copyright and the settings a
 * visitor might want without scrolling back to the top.
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'

import { useServiceStatus } from '../hooks/useServiceStatus'
import { COMPANY_LINKS, LEGAL_LINKS, TOOL_LINKS } from '../lib/routes'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LogoMark, Wordmark } from './Logo'
import { ThemeToggle } from './ThemeToggle'

const FOOTER_HEADING =
  'text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400'

const LINK_CLASS =
  'group inline-flex items-center gap-1 rounded text-sm text-slate-600 transition hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const status = useServiceStatus()

  const pillars = [
    { key: 'free', label: t('home.features.freeTitle') },
    { key: 'noSignup', label: t('home.features.noSignupTitle') },
    { key: 'instant', label: t('home.features.instantTitle') },
    { key: 'mobile', label: t('home.features.mobileTitle') },
  ]

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      {/* Trust band */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-md items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <ShieldCheck aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {t('footer.note')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t('footer.privacyShort')}
              </p>
            </div>
          </div>

          <ul className="flex flex-wrap gap-2">
            {pillars.map((pillar) => (
              <li
                key={pillar.key}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {pillar.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Link directory */}
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5" aria-label={t('nav.home')}>
            <LogoMark className="h-9 w-9" />
            <Wordmark />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t('footer.tagline')}
          </p>

          {status !== 'unknown' ? (
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {status === 'ok' ? t('footer.statusOk') : t('errors.network')}
            </p>
          ) : null}
        </div>

        <nav aria-labelledby="footer-tools" className="lg:col-span-2">
          <h2 id="footer-tools" className={FOOTER_HEADING}>
            {t('footer.toolsHeading')}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {TOOL_LINKS.map(({ path, labelKey, icon: Icon }) => (
              <li key={path}>
                <Link to={path} className={LINK_CLASS}>
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      size={15}
                      className="shrink-0 text-slate-400 transition group-hover:text-brand-600 dark:group-hover:text-brand-300"
                    />
                  ) : null}
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-8">
          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className={FOOTER_HEADING}>
              {t('footer.companyHeading')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={LINK_CLASS}>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className={FOOTER_HEADING}>
              {t('footer.legalHeading')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={LINK_CLASS}>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>

            <a
              href="/sitemap.xml"
              className="group mt-4 inline-flex items-center gap-1 rounded text-sm text-slate-600 transition hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300"
            >
              {t('footer.sitemap')}
              <ArrowUpRight
                aria-hidden="true"
                size={14}
                className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </nav>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {year} DOC Master. {t('footer.rights')}
          </p>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
