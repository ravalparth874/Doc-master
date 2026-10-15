/** Images to PDF page with reordering. */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Images, Loader2 } from 'lucide-react'

import { api, ApiError, type ToolResult } from '../../api'
import { Dropzone } from '../../components/Dropzone'
import { DownloadButton } from '../../components/DownloadButton'
import { ErrorAlert } from '../../components/ErrorAlert'
import { FileList } from '../../components/FileList'
import { ProgressBar } from '../../components/ProgressBar'
import { ToolPage } from '../../components/ToolPage'
import { useFileList } from '../../hooks/useFileList'
import { IMAGE_ACCEPT, MAX_FILES } from '../../lib/config'

const STEPS = [
  'Select the JPG or PNG images you want to combine. Photos taken with a phone work perfectly.',
  'Arrange them in the right order. Drag a row with your finger or mouse, or use the up and down arrows.',
  'Choose a page size: A4 and Letter fit the image onto a standard sheet, Original keeps the image at its own size.',
  'Press "Create PDF" and download the document.',
]

const BENEFITS = [
  {
    title: 'One image, one page',
    description:
      'Every image becomes a full page in the order you set, so a set of scanned documents reads naturally.',
  },
  {
    title: 'Print friendly layouts',
    description:
      'The A4 and Letter options centre each image on a standard sheet with white margins, ready to print.',
  },
  {
    title: 'Transparent images handled',
    description:
      'PNG screenshots with transparent backgrounds are flattened onto white so they never turn black when printed.',
  },
  {
    title: 'Correct orientation',
    description:
      'Photos taken sideways are rotated automatically using the orientation data stored in the image.',
  },
]

const FAQS = [
  {
    question: 'How do I convert images to a PDF?',
    answer:
      'Add your JPG or PNG files, put them in the right order, choose the page size and press "Create PDF". The whole set is combined into a single document you can download right away.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'JPG and PNG are supported, which covers phone photos, scans and screenshots. Each image may be up to 25 MB and you can add up to 20 of them at once.',
  },
  {
    question: 'Can I change the order after uploading?',
    answer:
      'Yes. Move an image up or down with the arrow buttons, or drag it into place. The PDF follows the order shown in the list.',
  },
  {
    question: 'Will the PDF look blurry when printed?',
    answer:
      'Images are embedded at high quality, so they print sharply at A4. If you want the file to stay small, lower the resolution in your camera or screenshot tool before uploading.',
  },
  {
    question: 'Are my images uploaded to a server?',
    answer:
      'The images are sent to our processing service so the PDF can be created, but they are handled in memory and are never written to a disk or kept after the download.',
  },
]

const PAGE_SIZES = ['a4', 'letter', 'original'] as const
type PageSize = (typeof PAGE_SIZES)[number]

export default function ImagesToPdf() {
  const { t } = useTranslation()
  const { files, add, remove, move } = useFileList()
  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const run = async () => {
    if (files.length === 0 || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      setResult(await api.imagesToPdf(files, pageSize, setProgress))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/images-to-pdf"
      name="Images to PDF"
      h1="Convert images to PDF online"
      subtitleKey="imagesToPdf.subtitle"
      seoTitle="Convert Images to PDF Online Free (JPG, PNG) | DOC Master"
      seoDescription="Convert JPG and PNG images to one PDF for free. Reorder photos and screenshots, choose A4 or Letter pages, no signup and instant deletion."
      steps={STEPS}
      benefits={BENEFITS}
      faqs={FAQS}
    >
      <Dropzone
        multiple
        accept={IMAGE_ACCEPT}
        disabled={busy}
        hint={`JPG or PNG · up to ${MAX_FILES} images · 25 MB each`}
        onFiles={(incoming) => {
          const outcome = add(incoming)
          setResult(null)
          if (outcome.skippedTooLarge > 0) setError(t('errors.tooLarge'))
          else if (outcome.skippedTooMany > 0)
            setError(t('uploader.maxFiles', { count: MAX_FILES }))
          else setError(null)
        }}
      />

      <div className="mt-6">
        <FileList
          files={files}
          orderable
          disabled={busy}
          onRemove={(index) => {
            remove(index)
            setResult(null)
          }}
          onMove={move}
        />
      </div>

      <fieldset className="mt-6" disabled={busy}>
        <legend className="label">{t('imagesToPdf.pageSizeLabel')}</legend>
        <div className="flex flex-wrap gap-2">
          {PAGE_SIZES.map((value) => (
            <label
              key={value}
              className={`choice-label ${
                pageSize === value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="page-size"
                className="sr-only"
                checked={pageSize === value}
                onChange={() => setPageSize(value)}
              />
              {t(`imagesToPdf.pageSizes.${value}`)}
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
        disabled={files.length === 0 || busy}
      >
        {busy ? (
          <Loader2 aria-hidden="true" size={18} className="animate-spin" />
        ) : (
          <Images aria-hidden="true" size={18} />
        )}
        {busy ? t('actions.processing') : t('imagesToPdf.button')}
      </button>

      <div className="mt-6">
        <DownloadButton result={result} labelKey="imagesToPdf.success" />
      </div>
    </ToolPage>
  )
}
