/**
 * Sticky site header.
 *
 * Desktop shows a compact bar with an "All tools" dropdown, the company links
 * and the language and theme controls. On phones the same information is
 * grouped into a single panel with icons, which is far easier to tap than a
 * wall of text links.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Info, Mail, Menu, ShieldCheck, X } from 'lucide-react'

import { COMPANY_LINKS, LEGAL_LINKS, TOOL_LINKS } from '../lib/routes'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LogoMark, Wordmark } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { ToolsDropdown } from './ToolsDropdown'

const COMPANY_ICONS: Record<string, typeof FileText> = {
  '/about': Info,
  '/contact': Mail,
  '/privacy': ShieldCheck,
  '/terms': FileText,
}

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close the panel on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Add a shadow once the page scrolls, so the bar reads as floating.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Stop the page behind the panel from scrolling on touch devices.
  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  // Escape closes the panel and returns focus to the toggle.
  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'text-brand-700 dark:text-brand-300'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
    }`

  const panelLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-100'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
    }`

  return (
    <header
      className={`safe-top sticky top-0 z-40 border-b bg-white/85 backdrop-blur-md dark:bg-slate-950/85 ${
        scrolled
          ? 'border-slate-200 shadow-sm shadow-slate-900/5 dark:border-slate-800'
          : 'border-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center gap-3">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          aria-label={t('nav.home')}
        >
          <LogoMark className="h-9 w-9 shrink-0" />
          <span className="flex items-baseline gap-2">
            <Wordmark />
            <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase dark:bg-brand-950/70 dark:text-brand-300 sm:inline">
              {t('common.free')}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t('nav.primary')}
          className="ml-2 hidden items-center gap-0.5 md:flex lg:ml-6"
        >
          <ToolsDropdown />
          {COMPANY_LINKS.map((link) => (
            <NavLink key={link.path} to={link.path} className={desktopLinkClass}>
              {({ isActive }) => (
                <>
                  {t(link.labelKey)}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            className="btn-ghost btn-icon md:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {menuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-slate-200 bg-white shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <nav
            aria-label={t('nav.primary')}
            className="container-page grid gap-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <section>
              <h2 className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {t('footer.toolsHeading')}
              </h2>
              <ul className="grid gap-1">
                {TOOL_LINKS.map(({ path, labelKey, icon: Icon }) => (
                  <li key={path}>
                    <NavLink to={path} className={panelLinkClass}>
                      {Icon ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                          <Icon aria-hidden="true" size={16} />
                        </span>
                      ) : null}
                      {t(labelKey)}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-slate-200 pt-3 dark:border-slate-800">
              <h2 className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {t('footer.companyHeading')}
              </h2>
              <ul className="grid gap-1">
                {[...COMPANY_LINKS, ...LEGAL_LINKS].map((link) => {
                  const Icon = COMPANY_ICONS[link.path]
                  return (
                    <li key={link.path}>
                      <NavLink to={link.path} className={panelLinkClass}>
                        {Icon ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <Icon aria-hidden="true" size={16} />
                          </span>
                        ) : null}
                        {t(link.labelKey)}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="border-t border-slate-200 pt-3 sm:hidden dark:border-slate-800">
              <h2 className="mb-1.5 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {t('language.label')}
              </h2>
              <div className="px-1">
                <LanguageSwitcher />
              </div>
            </section>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
