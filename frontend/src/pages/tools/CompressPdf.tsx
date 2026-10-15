/** Compress PDF page with quality levels and strict size targets. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Minimize2 } from 'lucide-react'

import { api, ApiError, type ToolResult } from '../../api'
import { Dropzone } from '../../components/Dropzone'
import { DownloadButton } from '../../components/DownloadButton'
import { ErrorAlert } from '../../components/ErrorAlert'
import { FileList } from '../../components/FileList'
import { ProgressBar } from '../../components/ProgressBar'
import { ToolPage } from '../../components/ToolPage'
import { useFileList } from '../../hooks/useFileList'
import { PDF_ACCEPT, formatBytes } from '../../lib/config'

const STEPS = [
  'Drop the PDF you need to shrink onto the upload area.',
  'Choose a compression level. Medium is a good default; use High when a portal rejects the file.',
  'If a website asks for an exact limit, pick the matching target such as "Under 200 KB". We keep shrinking until the file fits.',
  'Press "Compress PDF" and download the smaller document.',
]

const BENEFITS = [
  {
    title: 'Meets portal limits',
    description:
      'The target presets were built for government forms and job applications that reject files above 100 KB, 200 KB, 500 KB or 1 MB.',
  },
  {
    title: 'Text stays readable',
    description:
      'Low and Medium compression keep the text layer intact, so the document can still be searched and highlighted.',
  },
  {
    title: 'Honest about quality',
    description:
      'High compression flattens pages into images for the smallest file. The interface tells you before you choose it.',
  },
  {
    title: 'Never grows a file',
    description:
      'If your PDF is already small, it comes back unchanged instead of being made bigger by the optimizer.',
  },
]

const FAQS = [
  {
    question: 'How do I compress a PDF to 200 KB?',
    answer:
      'Upload your PDF, pick the "Under 200 KB" option and press "Compress PDF". We test progressively smaller versions of your document and stop as soon as it fits below the limit, then hand the file back to you.',
  },
  {
    question: 'Which compression level should I choose?',
    answer:
      'Use Low for forms and reports where text must stay perfect, Medium for scanned documents or presentations, and High when you need the smallest possible file for an upload limit.',
  },
  {
    question: 'Does compressing a PDF reduce its quality?',
    answer:
      'Low and Medium keep the page size and the text, and only re-compress images. High turns pages into images at a lower resolution, which is what makes the file so much smaller but means the text can no longer be selected.',
  },
  {
    question: 'What if my PDF cannot get under the target size?',
    answer:
      'We tell you honestly that the target was not reached instead of sending a file that is too large. In that case, try a larger target, remove some pages, or split the document into two files.',
  },
  {
    question: 'Is there a limit on how many times I can compress?',
    answer:
      'You can process as many documents as you like, one at a time. Each upload may be up to 25 MB and files are deleted the moment the download starts.',
  },
]

const LEVELS = ['low', 'medium', 'high'] as const
type Level = (typeof LEVELS)[number]

const TARGETS = [100, 200, 500, 1024] as const

export default function CompressPdf() {
  const { t } = useTranslation()
  const { files, add, remove } = useFileList()
  const [level, setLevel] = useState<Level>('medium')
  const [target, setTarget] = useState<number | ''>('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const file = files[0]
  const savings = result && file ? Math.max(0, file.size - result.blob.size) : 0

  const run = async () => {
    if (!file || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      setResult(await api.compress(file, level, target === '' ? undefined : target, setProgress))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/compress-pdf"
      name="Compress PDF"
      h1="Compress PDF online free"
      subtitleKey="compress.subtitle"
      seoTitle="Compress PDF to 200KB Online Free | DOC Master"
      seoDescription="Compress PDF files online for free. Reduce a PDF below 100 KB, 200 KB, 500 KB or 1 MB for government portals and job applications. No signup."
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

      <fieldset className="mt-6" disabled={busy}>
        <legend className="label">{t('compress.levelLabel')}</legend>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          {LEVELS.map((value) => (
            <label
              key={value}
              className={`choice flex-col ${
                level === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <input
                  type="radio"
                  name="compress-level"
                  value={value}
                  checked={level === value}
                  onChange={() => setLevel(value)}
                />
                {t(`compress.levels.${value}`)}
              </span>
              <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t(`compress.levelHints.${value}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6" disabled={busy}>
        <legend className="label">{t('compress.targetLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          <label
            className={`choice-label ${
              target === ''
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="compress-target"
              className="sr-only"
              checked={target === ''}
              onChange={() => setTarget('')}
            />
            {t('compress.targetNone')}
          </label>
          {TARGETS.map((value) => (
            <label
              key={value}
              className={`choice-label ${
                target === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="compress-target"
                className="sr-only"
                checked={target === value}
                onChange={() => setTarget(value)}
              />
              {t(`compress.targets.${value}`)}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('compress.targetNote')}
        </p>
      </fieldset>

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
        disabled={!file || busy}
      >
        {busy ? (
          <Loader2 aria-hidden="true" size={18} className="animate-spin" />
        ) : (
          <Minimize2 aria-hidden="true" size={18} />
        )}
        {busy ? t('actions.processing') : t('compress.button')}
      </button>

      <div className="mt-6">
        <DownloadButton result={result} labelKey="compress.success" />
        {result && file ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {`${formatBytes(file.size)} → ${formatBytes(result.blob.size)} (saved ${formatBytes(savings)})`}
          </p>
        ) : null}
      </div>
    </ToolPage>
  )
}
