/** About page: who we are and how the service works. */

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Cpu, Heart, Server, ShieldCheck } from 'lucide-react'

import { JsonLd } from '../components/JsonLd'
import { Seo } from '../components/Seo'
import { organizationLd } from '../lib/seo'

export default function About() {
  const { t } = useTranslation()

  return (
    <>
      <Seo
        title="About DOC Master – Free and Private Online PDF Tools"
        description="Learn who builds DOC Master, how the PDF tools work in memory, and why every file is deleted the moment you download it."
        path="/about"
      />
      <JsonLd data={organizationLd()} />

      <div className="container-page py-10 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          About DOC Master
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          DOC Master is a small, independent project built for the people who need a PDF fixed
          today: a student assembling an application, a shopkeeper emailing an invoice, or someone
          whose government portal keeps rejecting the file. Every tool is free, needs no account,
          and works on the phone that is already in your pocket.
        </p>

        <section aria-labelledby="story" className="mt-12 max-w-3xl">
          <h2 id="story" className="text-2xl font-bold text-slate-900 dark:text-white">
            Why it exists
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            Most online PDF tools ask you to create an account, cap the number of files per day, or
            keep a copy of your document &ldquo;for three days&rdquo; on a server you cannot
            inspect. A resume, a bank statement or a medical report deserves better than that. DOC
            Master was built on a simple rule: the document arrives, it is processed in memory, it
            is sent back to you, and then it does not exist anywhere.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            That rule shapes the whole product. There is no upload vault to maintain, no queue of
            stored documents, and no staff member who could look at your file by accident. It also
            means the service is quick: instead of writing a 30 MB file to a disk and reading it
            back, the processor keeps the bytes in memory for the second the job takes.
          </p>
        </section>

        <section aria-labelledby="how-it-works" className="mt-12">
          <h2 id="how-it-works" className="text-2xl font-bold text-slate-900 dark:text-white">
            How the tools work
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Server,
                title: 'You choose a file',
                text: 'The file is streamed from your device straight into the memory of the processing service.',
              },
              {
                icon: Cpu,
                title: 'It is processed',
                text: 'PDF libraries such as pypdf and PyMuPDF merge, split, compress or convert your pages.',
              },
              {
                icon: ShieldCheck,
                title: 'You download it',
                text: 'The finished document is streamed back as a download and your copy starts on your device.',
              },
              {
                icon: Heart,
                title: 'It disappears',
                text: 'When the request ends, the memory is released. No backup, no recycle bin, no trash folder.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-4 font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="commitments" className="mt-12 max-w-3xl">
          <h2 id="commitments" className="text-2xl font-bold text-slate-900 dark:text-white">
            What we promise
          </h2>
          <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
            <li>
              <strong className="text-slate-900 dark:text-white">No storage.</strong> Your files are
              never written to a disk, a database or a backup.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">No accounts.</strong> We do not ask
              for an email address, a phone number or a password.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">
                No advertising on documents.
              </strong>
              The files you download are clean and carry no watermark.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Honest errors.</strong> When a
              target size cannot be reached, we say so instead of sending a file that is too large.
            </li>
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/" className="btn-primary">
            {t('legal.backHome')}
          </Link>
          <Link to="/contact" className="btn-secondary">
            {t('nav.contact')}
          </Link>
        </div>
      </div>
    </>
  )
}
