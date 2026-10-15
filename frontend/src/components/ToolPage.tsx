/**
 * Shared layout for a tool page: breadcrumbs, heading, the tool itself and the
 * long form content that helps search engines rank the page.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Lock } from 'lucide-react'

import { breadcrumbLd, type FaqEntry } from '../lib/seo'
import { JsonLd } from './JsonLd'
import { Seo } from './Seo'
import { Benefits, Faq, HowTo } from './ToolContent'

export interface ToolPageProps {
  path: string
  name: string
  h1: string
  subtitleKey: string
  seoTitle: string
  seoDescription: string
  steps: string[]
  benefits: Array<{ title: string; description: string }>
  faqs: FaqEntry[]
  children: ReactNode
}

export function ToolPage({
  path,
  name,
  h1,
  subtitleKey,
  seoTitle,
  seoDescription,
  steps,
  benefits,
  faqs,
  children,
}: ToolPageProps) {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={seoTitle} description={seoDescription} path={path} />
      <JsonLd data={breadcrumbLd(name, path)} />

      <div className="container-page py-6 sm:py-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">
                {t('nav.home')}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} className="mx-0.5" />
            </li>
            <li className="font-medium text-slate-700 dark:text-slate-200">{name}</li>
          </ol>
        </nav>

        <header className="mt-4 max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white">
            {h1}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            {t(subtitleKey)}
          </p>
        </header>

        <section aria-label={name} className="card mt-6 p-4 sm:mt-8 sm:p-7">
          {children}
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
            <Lock aria-hidden="true" size={14} className="shrink-0 text-emerald-600" />
            {t('footer.privacyShort')}
          </p>
        </section>

        <HowTo title="How to use this tool" steps={steps} />
        <Benefits title="Why people use this tool" benefits={benefits} />
        <Faq title="Frequently asked questions" faqs={faqs} />
      </div>
    </>
  )
}
