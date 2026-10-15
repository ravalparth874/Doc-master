/** Split PDF page: keep a page range, or export every page into a ZIP. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Scissors } from 'lucide-react'

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
  'Choose the PDF you want to split by dropping it on the upload area.',
  'Pick "Extract a page range" and type the first and last page you want to keep, for example 2 to 5.',
  'Or choose "Every page as a separate PDF" to get one file per page inside a single ZIP download.',
  'Press "Split PDF" and download the result straight to your phone or computer.',
]

const BENEFITS = [
  {
    title: 'Two ways to split',
    description:
      'Keep a continuous range in a new PDF, or turn every page into its own file packed in a ZIP archive.',
  },
  {
    title: 'Nothing is re-encoded',
    description:
      'Pages are copied byte for byte, so the quality of scans, photos and text stays exactly the same.',
  },
  {
    title: 'Instant deletion',
    description:
      'The original and every page are held in memory only and are gone once the download starts.',
  },
  {
    title: 'Useful for applications',
    description:
      'Split out just the signature page, the Aadhaar page or one chapter of a report to send separately.',
  },
]

const FAQS = [
  {
    question: 'How do I split a PDF into single pages?',
    answer:
      'Upload the file, select the option "Every page as a separate PDF" and press the split button. You receive a ZIP archive with one file per page, named page-001.pdf, page-002.pdf and so on.',
  },
  {
    question: 'Can I extract a specific page range?',
    answer:
      'Yes. Enter the first and the last page, for example start at page 3 and end at page 7. Pages inside that range are kept in the same order and downloaded as a new PDF.',
  },
  {
    question: 'What happens if my page numbers are outside the document?',
    answer:
      'You get a clear message telling you how many pages the PDF actually has, so you can correct the range. Nothing is processed and nothing is stored.',
  },
  {
    question: 'Is splitting a PDF free?',
    answer:
      'Yes, every tool on DOC Master is free with no signup. There are no watermarks and no limits on how many documents you process.',
  },
  {
    question: 'Can I split a password protected PDF?',
    answer:
      'Not yet. Remove the password first using the unlock tool on this site, split the document, then protect it again if needed.',
  },
]

type Mode = 'range' | 'all'

export default function SplitPdf() {
  const { t } = useTranslation()
  const { files, add, remove } = useFileList()
  const [mode, setMode] = useState<Mode>('range')
  const [start, setStart] = useState('1')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const file = files[0]
  const canRun = Boolean(file) && !busy && (mode === 'all' || Boolean(end))

  const run = async () => {
    if (!file || !canRun) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const parsedStart = Number.parseInt(start, 10)
      const parsedEnd = Number.parseInt(end, 10)
      const output =
        mode === 'all'
          ? await api.splitAll(file, setProgress)
          : await api.split(file, { start: parsedStart || 1, end: parsedEnd }, setProgress)
      setResult(output)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/split-pdf"
      name="Split PDF"
      h1="Split PDF pages online"
      subtitleKey="split.subtitle"
      seoTitle="Split PDF Pages Online Free – Extract or Separate Pages | DOC Master"
      seoDescription="Split a PDF into a page range or export every page as a separate file in a ZIP. Free, fast, no signup and files are deleted instantly."
      steps={STEPS}
      benefits={BENEFITS}
      faqs={FAQS}
    >
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

      {file ? (
        <fieldset className="mt-6" disabled={busy}>
          <legend className="label">{t('split.modeLabel')}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`choice ${
                mode === 'range'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="split-mode"
                value="range"
                className="mt-1"
                checked={mode === 'range'}
                onChange={() => setMode('range')}
              />
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {t('split.modeRange')}
              </span>
            </label>
            <label
              className={`choice ${
                mode === 'all'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="split-mode"
                value="all"
                className="mt-1"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
              />
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {t('split.modeAll')}
              </span>
            </label>
          </div>

          {mode === 'range' ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="split-start" className="label">
                  {t('split.startLabel')}
                </label>
                <input
                  id="split-start"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="field"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="split-end" className="label">
                  {t('split.endLabel')}
                </label>
                <input
                  id="split-end"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="field"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          ) : null}
        </fieldset>
      ) : null}

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
        disabled={!canRun}
      >
        {busy ? (
          <Loader2 aria-hidden="true" size={18} className="animate-spin" />
        ) : (
          <Scissors aria-hidden="true" size={18} />
        )}
        {busy ? t('actions.processing') : t('split.button')}
      </button>

      <div className="mt-6">
        <DownloadButton
          result={result}
          labelKey={mode === 'all' ? 'split.successAll' : 'split.successRange'}
        />
      </div>
    </ToolPage>
  )
}
