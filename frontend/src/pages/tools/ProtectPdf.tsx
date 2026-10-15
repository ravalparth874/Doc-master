/** Protect and unlock PDF in a single page with two tabs. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRound, Loader2, Lock, Unlock } from 'lucide-react'

import { api, ApiError, type ToolResult } from '../../api'
import { Dropzone } from '../../components/Dropzone'
import { DownloadButton } from '../../components/DownloadButton'
import { ErrorAlert } from '../../components/ErrorAlert'
import { FileList } from '../../components/FileList'
import { ProgressBar } from '../../components/ProgressBar'
import { ToolPage } from '../../components/ToolPage'
import { useFileList } from '../../hooks/useFileList'
import { PDF_ACCEPT } from '../../lib/config'

const STEPS = [
  'Choose "Add password" to protect a document, or "Remove password" when you already know the password.',
  'Drop the PDF onto the upload area.',
  'Enter the password (twice when adding one) and press the button.',
  'Download the protected or unlocked file. Nothing is stored on any server.',
]

const BENEFITS = [
  {
    title: 'Strong AES-256 encryption',
    description:
      'Protected files use the same encryption standard that banks rely on, not a weak password scramble.',
  },
  {
    title: 'Opens in any reader',
    description:
      'The result works in Adobe Reader, phone viewers and every browser based PDF reader.',
  },
  {
    title: 'Recovery when you know the password',
    description:
      'Locked a file by accident? Remove the password here in a few seconds instead of searching for old emails.',
  },
  {
    title: 'Private by design',
    description:
      'The password is used in memory for one request and is never written to a log, a disk or an analytics tool.',
  },
]

const FAQS = [
  {
    question: 'How do I password protect a PDF?',
    answer:
      'Upload the PDF, type the password twice so we can catch typos, and press "Protect PDF". The download opens as an encrypted PDF that asks for the password before it displays a single page.',
  },
  {
    question: 'How do I remove a password from a PDF?',
    answer:
      'Switch to the "Remove password" tab, upload the locked file and type the password you set earlier. You get back a normal PDF that opens without asking for anything.',
  },
  {
    question: 'Can I open a PDF password protected by someone else?',
    answer:
      'No. Encryption in PDF is designed so that only the correct password unlocks the content. If you do not know the password, the file cannot be opened, not even by us.',
  },
  {
    question: 'What happens if I forget the password?',
    answer:
      'It cannot be recovered. Because we never store your file, we have no copy that could be unlocked later. Write the password down before you protect an important document.',
  },
  {
    question: 'Is my password sent to a server?',
    answer:
      'The password is sent over an encrypted HTTPS connection so the server can apply it to your file. It is used once, held in memory only, and never logged or shared.',
  },
]

type Mode = 'protect' | 'unlock'

export default function ProtectPdf() {
  const { t } = useTranslation()
  const { files, add, remove } = useFileList()
  const [mode, setMode] = useState<Mode>('protect')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const file = files[0]

  const run = async () => {
    if (!file || busy) {
      return
    }
    if (password.length < 4) {
      setError(t('protect.passwordHint'))
      return
    }
    if (mode === 'protect' && password !== confirm) {
      setError(t('errors.generic'))
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const output =
        mode === 'protect'
          ? await api.protect(file, password, confirm, setProgress)
          : await api.unlock(file, password, setProgress)
      setResult(output)
      setPassword('')
      setConfirm('')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  const tabs: Array<{ id: Mode; label: string }> = [
    { id: 'protect', label: t('protect.tabProtect') },
    { id: 'unlock', label: t('protect.tabUnlock') },
  ]

  return (
    <ToolPage
      path="/protect-pdf"
      name="Protect PDF"
      h1="Protect or unlock a PDF with a password"
      subtitleKey="protect.subtitle"
      seoTitle="Protect PDF with Password Online Free – Unlock PDF | DOC Master"
      seoDescription="Add a password to a PDF or remove one you know, free and without signup. Files are processed in memory and deleted instantly."
      steps={STEPS}
      benefits={BENEFITS}
      faqs={FAQS}
    >
      <div role="tablist" aria-label={t('protect.title')} className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={mode === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => {
              setMode(tab.id)
              setResult(null)
              setError(null)
            }}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              mode === tab.id
                ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/50 dark:text-brand-100'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`} className="mt-6">
        <Dropzone
          accept={PDF_ACCEPT}
          disabled={busy}
          hint="PDF only · 25 MB maximum"
          onFiles={(incoming) => {
            add(incoming.slice(0, 1))
            setResult(null)
            setError(null)
          }}
        />

        <div className="mt-6">
          <FileList
            files={files}
            disabled={busy}
            onRemove={() => {
              remove(0)
              setResult(null)
            }}
            onMove={() => undefined}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">
              {t('protect.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              className="field"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {mode === 'protect' ? (
            <div>
              <label htmlFor="confirm-password" className="label">
                {t('protect.confirmLabel')}
              </label>
              <input
                id="confirm-password"
                type="password"
                className="field"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {mode === 'protect' ? t('protect.passwordHint') : t('protect.unlockHint')}
        </p>

        {error ? (
          <div className="mt-4">
            <ErrorAlert message={error} onDismiss={() => setError(null)} />
          </div>
        ) : null}

        {busy ? (
          <div className="mt-6">
            <ProgressBar value={progress} label={t('actions.processing')} />
          </div>
        ) : null}

        <button
          type="button"
          className="btn-primary mt-6 w-full sm:w-auto"
          onClick={() => void run()}
          disabled={!file || busy || password.length < 4}
        >
          {busy ? (
            <Loader2 aria-hidden="true" size={18} className="animate-spin" />
          ) : mode === 'protect' ? (
            <Lock aria-hidden="true" size={18} />
          ) : (
            <Unlock aria-hidden="true" size={18} />
          )}
          {busy
            ? t('actions.processing')
            : mode === 'protect'
              ? t('protect.protectButton')
              : t('protect.unlockButton')}
        </button>

        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <KeyRound aria-hidden="true" size={14} />
          {mode === 'protect'
            ? 'AES-256 encryption is applied to the copy you download.'
            : 'Your password is checked once and then discarded.'}
        </p>

        <div className="mt-6">
          <DownloadButton
            result={result}
            labelKey={mode === 'protect' ? 'protect.protectSuccess' : 'protect.unlockSuccess'}
          />
        </div>
      </div>
    </ToolPage>
  )
}
