/** Terms of use. */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Seo } from '../components/Seo'

const LAST_UPDATED = '1 October 2026'

export default function Terms() {
  const { t } = useTranslation()

  return (
    <>
      <Seo
        title="Terms of Use – DOC Master"
        description="Terms of use for DOC Master, the free online PDF toolkit. Acceptable use, limits, and the fact that files are processed in memory and deleted."
        path="/terms"
      />

      <div className="container-page py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Terms of Use
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('legal.lastUpdated')}: {LAST_UPDATED}
        </p>

        <div className="prose-page mt-8 max-w-3xl space-y-8 text-[15px] leading-relaxed">
          <p>
            By using DOC Master you agree to these terms. They are written in plain language on
            purpose. If you do not agree, please do not upload documents.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. The service</h2>
            <p className="mt-2">
              DOC Master offers free online tools that merge, split, compress, convert, rotate and
              password protect PDF documents. The service is provided as is, without any promise of
              availability, accuracy or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Your files</h2>
            <p className="mt-2">
              Files are processed in memory and deleted as soon as the result has been sent to you.
              You keep all rights to the documents you upload, and you are responsible for having
              the right to upload, process and share them. Please do not upload illegal content,
              someone else&rsquo;s confidential documents without permission, or material you were
              not asked to process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Acceptable use</h2>
            <p className="mt-2">
              Do not use the service to break the law, to attack the service, to upload malicious
              files, or to send so many requests that other people cannot use the site. Fair use
              limits and rate limits apply so the tools stay available to everyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Availability</h2>
            <p className="mt-2">
              We aim to keep the tools online at all times but do not guarantee uptime. Jobs may be
              refused if a document is too large, if the service is under heavy load, or if a
              request looks like abuse. Keep your own copy of every document you care about.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Passwords</h2>
            <p className="mt-2">
              Passwords you enter are used once and then discarded. If you forget a password we set
              for you, we cannot help, because we never keep a copy of your file or its password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. No warranty</h2>
            <p className="mt-2">
              Compression can lower image quality, and tools can fail on damaged files. Please check
              the downloaded result before you rely on it, for example before sending it to a
              government portal. To the extent permitted by law, the operators of DOC Master are not
              liable for any loss or damage arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              7. Intellectual property
            </h2>
            <p className="mt-2">
              The DOC Master name, logo and interface belong to the project. You may link to the
              site freely. You may not copy the service and present it as your own.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">8. Changes</h2>
            <p className="mt-2">
              These terms may change as the service grows. The date at the top of this page shows
              the latest version, and continuing to use the service means accepting it.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/" className="btn-secondary">
            {t('legal.backHome')}
          </Link>
          <Link to="/privacy" className="btn-secondary">
            {t('nav.privacy')}
          </Link>
        </div>
      </div>
    </>
  )
}
