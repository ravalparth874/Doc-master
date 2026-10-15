/** PDF to images page: exports every page as JPG or PNG inside a ZIP. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageDown, Loader2 } from 'lucide-react'

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
  'Drop the PDF you want to turn into images onto the upload area.',
  'Choose JPG for smaller files, or PNG when you need the sharpest possible quality.',
  'Press "Export images" and wait a few seconds while the pages are rendered.',
  'Download the ZIP file and unpack it to get one image per page.',
]

const BENEFITS = [
  {
    title: 'One click per page',
    description:
      'Every page is rendered at a high resolution and packed into a single ZIP, so there is nothing to rename by hand.',
  },
  {
    title: 'Useful everywhere',
    description:
      'Upload a page to WhatsApp, insert a slide into a presentation, or share a form photo with a friend.',
  },
  {
    title: 'Choice of quality',
    description:
      'JPG keeps files small for photos while PNG stays lossless for text, signatures and line drawings.',
  },
  {
    title: 'Nothing kept afterwards',
    description:
      'The rendered images are created in memory and are gone as soon as the ZIP has been downloaded.',
  },
]

const FAQS = [
  {
    question: 'How do I convert a PDF to images?',
    answer:
      'Upload the PDF, choose JPG or PNG and press "Export images". You get a ZIP archive that contains one image file for every page of your document.',
  },
  {
    question: 'Should I choose JPG or PNG?',
    answer:
      'Choose JPG for scanned documents and photos because the file stays small. Choose PNG for pages that contain mostly text, signatures or diagrams, since PNG keeps every line sharp.',
  },
  {
    question: 'How many images can I get from one PDF?',
    answer:
      'One image per page, in order, named page-001, page-002 and so on. Very long documents are limited so the server does not run out of memory, and you will be told if a file is too long.',
  },
  {
    question: 'Is the resolution good enough for printing?',
    answer:
      'Yes. Pages are rendered at roughly 150 DPI, which matches the quality of a good office scanner and is sharp on screen and in print for A4 pages.',
  },
  {
    question: 'Do you keep my PDF after conversion?',
    answer:
      'No. Both the PDF and the generated images exist only in memory while the job runs. Nothing is written to a disk and nothing is stored after the response is sent.',
  },
]

export default function PdfToImages() {
  const { t } = useTranslation()
  const { files, add, remove } = useFileList()
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const file = files[0]

  const run = async () => {
    if (!file || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      setResult(await api.pdfToImages(file, format, setProgress))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/pdf-to-images"
      name="PDF to Images"
      h1="Convert PDF to images online"
      subtitleKey="pdfToImages.subtitle"
      seoTitle="Convert PDF to Images Online Free – JPG & PNG | DOC Master"
      seoDescription="Convert a PDF to images for free. Export every page as a JPG or PNG and download them together in one ZIP file. No signup, no watermark."
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
        <legend className="label">{t('pdfToImages.formatLabel')}</legend>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {(['jpeg', 'png'] as const).map((value) => (
            <label
              key={value}
              className={`choice flex-col ${
                format === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <input
                  type="radio"
                  name="image-format"
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                {t(`pdfToImages.formats.${value}`)}
              </span>
              <span className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t(`pdfToImages.formatHint.${value}`)}
              </span>
            </label>
          ))}
        </div>
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
          <ImageDown aria-hidden="true" size={18} />
        )}
        {busy ? t('actions.processing') : t('pdfToImages.button')}
      </button>

      <div className="mt-6">
        <DownloadButton result={result} labelKey="pdfToImages.success" />
      </div>
    </ToolPage>
  )
}
