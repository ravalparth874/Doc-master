/** Static content blocks shared by every tool page (steps, benefits, FAQ). */

import { CheckCircle2, HelpCircle } from 'lucide-react'

import type { FaqEntry } from '../lib/seo'
import { faqLd } from '../lib/seo'
import { JsonLd } from './JsonLd'

interface HowToProps {
  title: string
  steps: string[]
}

export function HowTo({ title, steps }: HowToProps) {
  return (
    <section aria-labelledby="how-to-heading" className="mt-10 sm:mt-14">
      <h2
        id="how-to-heading"
        className="text-xl font-bold text-balance text-slate-900 sm:text-2xl dark:text-white"
      >
        {title}
      </h2>
      <ol className="mt-4 space-y-4 sm:mt-5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 sm:gap-4">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm"
            >
              {index + 1}
            </span>
            <p className="prose-page pt-1 text-[15px] leading-relaxed">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

interface BenefitsProps {
  title: string
  benefits: Array<{ title: string; description: string }>
}

export function Benefits({ title, benefits }: BenefitsProps) {
  return (
    <section aria-labelledby="benefits-heading" className="mt-10 sm:mt-14">
      <h2
        id="benefits-heading"
        className="text-xl font-bold text-balance text-slate-900 sm:text-2xl dark:text-white"
      >
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
        {benefits.map((benefit) => (
          <li key={benefit.title} className="card p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              <CheckCircle2 aria-hidden="true" size={18} className="text-emerald-600" />
              {benefit.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {benefit.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

interface FaqProps {
  title: string
  faqs: FaqEntry[]
}

export function Faq({ title, faqs }: FaqProps) {
  return (
    <section aria-labelledby="faq-heading" className="mt-10 sm:mt-14">
      <h2
        id="faq-heading"
        className="text-xl font-bold text-balance text-slate-900 sm:text-2xl dark:text-white"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-3 sm:mt-5">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="card group px-4 py-4 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1 text-[15px] font-semibold text-balance text-slate-900 dark:text-white">
              <span className="flex items-start gap-2">
                <HelpCircle
                  aria-hidden="true"
                  size={18}
                  className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
                />
                {faq.question}
              </span>
              <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 pl-7 text-sm leading-relaxed text-slate-600 sm:mt-3 dark:text-slate-300">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
      <JsonLd data={faqLd(faqs)} />
    </section>
  )
}
