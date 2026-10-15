/** Home page: tool grid, why DOC Master, how it works and FAQs. */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EyeOff, Gauge, ShieldCheck, Smartphone, Sparkles, UserX, Zap } from 'lucide-react'

import { JsonLd } from '../components/JsonLd'
import { Seo } from '../components/Seo'
import { ToolCard } from '../components/ToolCard'
import { TOOL_LINKS } from '../lib/routes'
import { faqLd, webApplicationLd, type FaqEntry } from '../lib/seo'

const FEATURES = [
  {
    key: 'free',
    icon: Sparkles,
  },
  {
    key: 'noSignup',
    icon: UserX,
  },
  {
    key: 'instant',
    icon: EyeOff,
  },
  {
    key: 'mobile',
    icon: Smartphone,
  },
]

const FAQS: FaqEntry[] = [
  {
    question: 'Is DOC Master really free?',
    answer:
      'Yes. Every tool is free, with no watermarks, no file limits and no account. There is no premium version to upgrade to.',
  },
  {
    question: 'Where are my files stored?',
    answer:
      'They are not. Each file is read into memory, processed and sent back to you, then it is gone. We never write your documents to a disk, a database or a backup.',
  },
  {
    question: 'Do you need my phone number or email address?',
    answer:
      'No. There is no signup, no login and no email required. Open a tool, drop your file and download the result.',
  },
  {
    question: 'How large a file can I process?',
    answer:
      'Each file may be up to 25 MB by default, and you can merge or convert up to 20 files in one job. The limit can be changed by the site owner.',
  },
  {
    question: 'Can I use DOC Master on a phone?',
    answer:
      'Yes. The site is built mobile first, so you can take a photo of a document, turn it into a PDF and compress it to pass an upload limit, all from your phone.',
  },
]

export default function Home() {
  const { t } = useTranslation()

  return (
    <>
      <Seo
        title="DOC Master – All Your PDF Tools in One Place. Free, Fast & Private"
        description="Free online PDF toolkit: merge, split, compress to 200KB, convert images to PDF, rotate, and password protect PDFs. No signup, files deleted instantly."
        path="/"
      />
      <JsonLd data={webApplicationLd()} />
      <JsonLd data={faqLd(FAQS)} />

      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(79,70,229,0.18),transparent)]"
        />
        <div className="container-page py-10 text-center sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-slate-900/70 dark:text-brand-300">
            <ShieldCheck aria-hidden="true" size={16} />
            {t('home.heroBadge')}
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-balance text-slate-900 sm:mt-6 sm:text-5xl dark:text-white">
            {t('home.heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
            <a href="#tools" className="btn-primary w-full sm:w-auto">
              <Zap aria-hidden="true" size={18} />
              {t('home.heroCta')}
            </a>
            <a href="#how" className="btn-secondary w-full sm:w-auto">
              {t('home.heroSecondary')}
            </a>
          </div>
        </div>
      </section>

      <section id="tools" aria-labelledby="tools-heading" className="container-page pb-4">
        <h2
          id="tools-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
        >
          {t('home.toolsTitle')}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          {t('home.toolsSubtitle')}
        </p>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {TOOL_LINKS.map(({ path, labelKey, descriptionKey, icon }) => (
            <ToolCard
              key={path}
              to={path}
              icon={icon}
              title={t(labelKey)}
              description={t(descriptionKey)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="why-heading" className="container-page mt-12 sm:mt-16">
        <h2
          id="why-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
        >
          {t('home.whyTitle')}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          {t('home.whySubtitle')}
        </p>

        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div key={key} className="card p-4 sm:p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                <Icon aria-hidden="true" size={22} />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                {t(`home.features.${key}Title`)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`home.features.${key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" aria-labelledby="how-heading" className="container-page mt-12 sm:mt-16">
        <h2
          id="how-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
        >
          {t('home.howTitle')}
        </h2>
        <ol className="mx-auto mt-6 grid max-w-4xl gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
          {[1, 2, 3].map((step) => (
            <li key={step} className="card p-4 sm:p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 font-bold text-white">
                {step}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t(`home.steps.${['one', 'two', 'three'][step - 1]}`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading" className="container-page mt-12 sm:mt-16">
        <h2
          id="faq-heading"
          className="text-center text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white"
        >
          {t('home.faqTitle')}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600 dark:text-slate-300">
          {t('home.faqSubtitle')}
        </p>

        <div className="mx-auto mt-6 max-w-3xl space-y-3 sm:mt-8">
          {FAQS.map((faq) => (
            <details key={faq.question} className="card group px-4 py-4 sm:px-5">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1 text-[15px] font-semibold text-balance text-slate-900 dark:text-white">
                {faq.question}
                <span aria-hidden="true" className="text-slate-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-page mt-12 sm:mt-16">
        <div className="card flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-accent-600 p-6 text-center text-white sm:flex-row sm:p-8 sm:text-left">
          <div className="flex items-center gap-3">
            <Gauge aria-hidden="true" size={28} />
            <p className="text-lg font-semibold">{t('footer.tagline')}</p>
          </div>
          <Link
            to="/compress-pdf"
            className="btn w-full bg-white/95 text-brand-700 hover:bg-white sm:w-auto"
          >
            {t('compress.button')}
          </Link>
        </div>
      </section>
    </>
  )
}
