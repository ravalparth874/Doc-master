/** Privacy policy with real, specific wording. */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Seo } from '../components/Seo'

const LAST_UPDATED = '1 October 2026'

export default function Privacy() {
  const { t } = useTranslation()

  return (
    <>
      <Seo
        title="Privacy Policy – Files Processed in Memory and Deleted"
        description="DOC Master privacy policy: PDFs are processed in memory, never stored, never shared, and never written to a disk. Read what cookies and analytics we use."
        path="/privacy"
      />

      <div className="container-page py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t('legal.lastUpdated')}: {LAST_UPDATED}
        </p>

        <div className="prose-page mt-8 max-w-3xl space-y-8 text-[15px] leading-relaxed">
          <p>
            This policy explains what DOC Master does with the information you give us. The short
            version: <strong>your files are never stored</strong>. They are processed in memory,
            returned to you, and then forgotten.
          </p>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              1. Files you upload
            </h2>
            <p className="mt-2">
              When you choose a file, it is sent over an encrypted HTTPS connection to the
              processing service so the tool you picked can do its job. The bytes are held in memory
              only. Nothing is written to a hard disk, a temporary folder, a database or a backup,
              and no copy survives the request. When the response has been sent, the memory is
              released.
            </p>
            <p className="mt-2">
              We do not read the contents of your documents, we do not analyse them, and we never
              use them to train anything. File names and file contents are never written to our
              logs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Passwords</h2>
            <p className="mt-2">
              When you add or remove a password, that password is used once to process your file and
              is then discarded. We cannot recover it for you and we have no way to look it up
              later.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              3. Technical information we do keep
            </h2>
            <p className="mt-2">
              Our web server keeps short-lived, standard web server logs such as the requested URL,
              the timestamp, a truncated IP address and the browser user agent. These records are
              used only to keep the service running and to block abuse, they contain no document and
              no file name, and they are rotated automatically.
            </p>
            <p className="mt-2">
              We also count how often each tool is used, without identifying you, to see which tools
              deserve attention.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Cookies</h2>
            <p className="mt-2">
              DOC Master itself sets no tracking cookies and runs no advertising scripts. Two small
              values may be stored in your browser&rsquo;s local storage, never as cookies: your
              choice of dark or light mode, and your choice of language. They never leave your
              device and you can clear them at any time from your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Analytics</h2>
            <p className="mt-2">
              To keep the site free, the operator may enable a privacy-friendly analytics service
              such as Plausible, or Google Analytics 4. If analytics is enabled it is limited to
              page views, approximate country and device type. We never send documents, file names,
              passwords or contact messages to an analytics provider, and we do not use cross-site
              advertising trackers. If no analytics script is present on the page you loaded, then
              no analytics data is being collected at all.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              6. Messages you send
            </h2>
            <p className="mt-2">
              If you use the contact form, the message is delivered by email so we can reply. That
              email is kept for as long as needed to handle your request and is not used for
              marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Children</h2>
            <p className="mt-2">
              The service is intended for adults. We do not knowingly collect personal information
              from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">8. Your rights</h2>
            <p className="mt-2">
              Because we do not keep your files, there is nothing for us to export or delete. If you
              have a question about this policy or about a message you sent us, use the{' '}
              <Link
                to="/contact"
                className="font-medium text-brand-700 underline dark:text-brand-300"
              >
                contact page
              </Link>{' '}
              and we will answer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">9. Changes</h2>
            <p className="mt-2">
              If this policy changes, the date at the top of the page changes too. Material changes
              will be summarised on the home page.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link to="/" className="btn-secondary">
            {t('legal.backHome')}
          </Link>
        </div>
      </div>
    </>
  )
}
