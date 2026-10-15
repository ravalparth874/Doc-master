/**
 * "All tools" dropdown for the desktop navigation.
 *
 * The header cannot show seven tool links inline without crowding the bar, so
 * they live in one panel. It opens on click and on hover, closes on Escape,
 * on outside click and after navigating.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { TOOL_LINKS } from '../lib/routes'

export function ToolsDropdown() {
  const { t } = useTranslation()
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [hoverOpen, setHoverOpen] = useState(false)

  const isOpen = open || hoverOpen
  const isActive = TOOL_LINKS.some((tool) => tool.path === location.pathname)

  // Close once a route has changed.
  useEffect(() => {
    setOpen(false)
    setHoverOpen(false)
  }, [location.pathname])

  // Close when the pointer or a click lands outside the panel.
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setHoverOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen])

  // Escape closes the panel and returns focus to the trigger.
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setHoverOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setHoverOpen(true)}
      onMouseLeave={() => setHoverOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="tools-menu"
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'text-brand-700 dark:text-brand-300'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        {t('nav.allTools')}
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
        {isActive ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400"
          />
        ) : null}
      </button>

      {isOpen ? (
        <div
          id="tools-menu"
          className="absolute left-1/2 top-full z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 pt-3"
        >
          <div className="card overflow-hidden p-2 shadow-lg">
            <ul className="grid gap-1 sm:grid-cols-2">
              {TOOL_LINKS.map(({ path, labelKey, descriptionKey, icon: Icon }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                      location.pathname === path
                        ? 'bg-brand-50 dark:bg-brand-950/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {Icon ? (
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                        <Icon aria-hidden="true" size={18} />
                      </span>
                    ) : null}
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-semibold ${
                          location.pathname === path
                            ? 'text-brand-800 dark:text-brand-100'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {t(labelKey)}
                      </span>
                      {descriptionKey ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                          {t(descriptionKey)}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
