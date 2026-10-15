/** Contact page with a form that posts to the backend. */

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Loader2, Mail, Send } from 'lucide-react'

import { api, ApiError } from '../api'
import { ErrorAlert } from '../components/ErrorAlert'
import { Seo } from '../components/Seo'

export default function Contact() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const response = await api.contact({ name, email, message })
      setSent(response.ok)
      setName('')
      setEmail('')
      setMessage('')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('contact.failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Seo
        title="Contact DOC Master – Report a Bug or Request a Feature"
        description="Contact DOC Master with a bug report, a feature request or a question about the free online PDF tools. We reply by email."
        path="/contact"
      />

      <div className="container-page py-10 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('contact.title')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {t('contact.subtitle')}
          </p>

          <form onSubmit={(event) => void submit(event)} className="card mt-8 space-y-4 p-5 sm:p-7">
            <div>
              <label htmlFor="contact-name" className="label">
                {t('contact.name')}
              </label>
              <input
                id="contact-name"
                className="field"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder={t('contact.namePlaceholder')}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="label">
                {t('contact.email')}
              </label>
              <input
                id="contact-email"
                type="email"
                className="field"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="label">
                {t('contact.message')}
              </label>
              <textarea
                id="contact-message"
                className="field min-h-32"
                required
                minLength={10}
                maxLength={4000}
                placeholder={t('contact.messagePlaceholder')}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('contact.requiredHint')}
              </p>
            </div>

            {/* Honeypot: hidden from people, tempting for bots. */}
            <div aria-hidden="true" className="hidden">
              <label htmlFor="contact-company">Company</label>
              <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" />
            </div>

            {error ? <ErrorAlert message={error} onDismiss={() => setError(null)} /> : null}

            {sent ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                <CheckCircle2 aria-hidden="true" size={18} />
                {t('contact.success')}
              </p>
            ) : null}

            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
              {busy ? (
                <Loader2 aria-hidden="true" size={18} className="animate-spin" />
              ) : (
                <Send aria-hidden="true" size={18} />
              )}
              {busy ? t('contact.sending') : t('contact.send')}
            </button>
          </form>

          <p className="mt-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Mail aria-hidden="true" size={16} />
            {t('contact.orEmail')}{' '}
            <a
              href="mailto:hello@docmaster.example"
              className="font-medium text-brand-700 underline dark:text-brand-300"
            >
              hello@docmaster.example
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
