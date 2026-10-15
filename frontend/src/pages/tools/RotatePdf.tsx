/** Rotate PDF page. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, RotateCw } from 'lucide-react'

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
  'Drop the PDF with sideways or upside down pages onto the upload area.',
  'Choose whether to turn every page or only certain pages such as 1, 3 or 2-5.',
  'Pick 90, 180 or 270 degrees and press "Rotate PDF".',
  'Download the corrected document.',
]

const BENEFITS = [
  {
    title: 'Fixes scanner problems',
    description:
      'Flatbed scanners and phone cameras often save pages sideways. Rotating them takes two taps.',
  },
  {
    title: 'Rotate just one page',
    description:
      'Only page 2 was scanned the wrong way? Type the page number and leave the rest untouched.',
  },
  {
    title: 'No quality loss',
    description:
      'Rotation only changes the page orientation recorded in the file, so no pixels are resampled.',
  },
  {
    title: 'Repeatable turns',
    description:
      'Press 90 degrees three times and a page ends up upside down again, which makes experimenting easy.',
  },
]

const FAQS = [
  {
    question: 'How do I rotate a PDF page?',
    answer:
      'Upload the PDF, choose 90, 180 or 270 degrees, select the pages you want and press "Rotate PDF". The new file appears immediately with the pages standing the right way up.',
  },
  {
    question: 'Can I rotate only some pages?',
    answer:
      'Yes. Leave "All pages" off and type the page numbers, for example 1, 3 or a range like 2-5. Every other page keeps its current orientation.',
  },
  {
    question: 'Does rotating reduce the quality of the PDF?',
    answer:
      'No. The rotation is stored as a page property, so the text and images are not re-rendered and the file size stays almost the same.',
  },
  {
    question: 'What is the difference between 90, 180 and 270 degrees?',
    answer:
      '90 degrees turns the page a quarter turn clockwise, 180 degrees turns it upside down, and 270 degrees is a quarter turn the other way. Choose the option that matches what you need.',
  },
  {
    question: 'Can I rotate a scanned document to make it smaller?',
    answer:
      'No. Rotation never changes the file size. To reduce the size of a scan, use the compress tool and pick High compression.',
  },
]

const ANGLES = [90, 180, 270] as const

export default function RotatePdf() {
  const { t } = useTranslation()
  const { files, add, remove } = useFileList()
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90)
  const [allPages, setAllPages] = useState(true)
  const [pages, setPages] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const file = files[0]

  const run = async () => {
    if (!file || busy) {
      return
    }
    if (!allPages && !pages.trim()) {
      setError(t('rotate.pagesHint'))
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      setResult(await api.rotate(file, degrees, allPages ? 'all' : pages, setProgress))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/rotate-pdf"
      name="Rotate PDF"
      h1="Rotate PDF pages online"
      subtitleKey="rotate.subtitle"
      seoTitle="Rotate PDF Pages Online Free | DOC Master"
      seoDescription="Rotate all pages of a PDF or only the pages you choose by 90, 180 or 270 degrees. Free online PDF rotator with no signup and instant file deletion."
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
        <legend className="label">{t('rotate.angleLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {ANGLES.map((value) => (
            <label
              key={value}
              className={`choice-label px-4 ${
                degrees === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="rotation"
                className="sr-only"
                checked={degrees === value}
                onChange={() => setDegrees(value)}
              />
              {`${value}°`}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6" disabled={busy}>
        <legend className="label">{t('rotate.pagesLabel')}</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={allPages}
            onChange={(event) => setAllPages(event.target.checked)}
          />
          {t('rotate.pagesAll')}
        </label>
        {!allPages ? (
          <div className="mt-2">
            <label htmlFor="rotate-pages" className="sr-only">
              {t('rotate.pagesLabel')}
            </label>
            <input
              id="rotate-pages"
              className="field"
              placeholder={t('rotate.pagesHint')}
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              inputMode="numeric"
            />
          </div>
        ) : null}
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
          <RotateCw aria-hidden="true" size={18} />
        )}
        {busy ? t('actions.processing') : t('rotate.button')}
      </button>

      <div className="mt-6">
        <DownloadButton result={result} labelKey="rotate.success" />
      </div>
    </ToolPage>
  )
}
