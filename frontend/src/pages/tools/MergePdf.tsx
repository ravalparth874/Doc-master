/**
 * Merge PDF page.
 *
 * Visitors add two or more documents, drag or nudge them into the right order,
 * and the backend joins them in memory.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileStack, Loader2, Sparkles } from 'lucide-react'

import { api, ApiError, type ToolResult } from '../../api'
import { Dropzone } from '../../components/Dropzone'
import { DownloadButton } from '../../components/DownloadButton'
import { ErrorAlert } from '../../components/ErrorAlert'
import { FileList } from '../../components/FileList'
import { ProgressBar } from '../../components/ProgressBar'
import { ToolPage } from '../../components/ToolPage'
import { useFileList } from '../../hooks/useFileList'
import { MAX_FILES, PDF_ACCEPT } from '../../lib/config'

const STEPS = [
  'Add two or more PDF files with the upload area above. You can pick them from your phone, tablet or computer.',
  'Put the files in the order you want. Drag a row with your finger or mouse, or use the up and down arrows next to each file.',
  'Press "Merge PDFs". The files are combined in memory and the finished document appears below, ready to download.',
]

const BENEFITS = [
  {
    title: 'No signup, no watermark',
    description:
      'The merged file is clean and ready to submit. There is no trial version and no account to create.',
  },
  {
    title: 'Exact order control',
    description:
      'Reorder with a drag gesture or with the arrow buttons, which works perfectly on a keyboard too.',
  },
  {
    title: 'Nothing is stored',
    description:
      'Your documents are processed in RAM and disappear as soon as you download the result.',
  },
  {
    title: 'Works for large sets',
    description:
      'Combine up to 20 files in one go, for example an application form plus its attachments.',
  },
]

const FAQS = [
  {
    question: 'Is merging PDF files free and safe?',
    answer:
      'Yes. Merging is free, needs no account and happens entirely in memory. We never write your files to a disk or a database, and we never share them with anyone.',
  },
  {
    question: 'How many PDFs can I merge at once?',
    answer:
      'You can merge up to 20 files in a single job, and each file may be up to 25 MB. That is enough for a full application pack or a chapter of scanned pages.',
  },
  {
    question: 'Does merging reduce the quality of my documents?',
    answer:
      'No. Pages are copied exactly as they are, so text stays selectable, images stay sharp and the file size only grows by the total of the originals.',
  },
  {
    question: 'Can I merge password protected PDFs?',
    answer:
      'Not directly. Remove the password first with our unlock tool, merge the files, then protect the finished document again if you need to.',
  },
  {
    question: 'Will the order of my files change?',
    answer:
      'No. Files are merged top to bottom in the order shown in the list, so you always know which document comes first.',
  },
]

export default function MergePdf() {
  const { t } = useTranslation()
  const { files, add, remove, move } = useFileList()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ToolResult | null>(null)

  const run = async () => {
    if (files.length < 2 || busy) {
      return
    }
    setBusy(true)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      setResult(await api.merge(files, setProgress))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolPage
      path="/merge-pdf"
      name="Merge PDF"
      h1="Merge PDF files online"
      subtitleKey="merge.subtitle"
      seoTitle="Merge PDF Online Free – No Signup | DOC Master"
      seoDescription="Merge multiple PDF files into one document for free. Reorder pages with drag and drop, no signup, no watermark and files are deleted instantly."
      steps={STEPS}
      benefits={BENEFITS}
      faqs={FAQS}
    >
      <Dropzone
        multiple
        accept={PDF_ACCEPT}
        disabled={busy}
        hint={`PDF only · up to ${MAX_FILES} files · 25 MB each`}
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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto"
          onClick={() => void run()}
          disabled={busy || files.length < 2}
        >
          {busy ? (
            <Loader2 aria-hidden="true" size={18} className="animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" size={18} />
          )}
          {busy ? t('actions.processing') : t('merge.button')}
        </button>
        <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <FileStack aria-hidden="true" size={16} />
          {files.length < 2 ? t('uploader.selectedCount', { count: files.length }) : null}
        </p>
      </div>

      <div className="mt-6">
        <DownloadButton result={result} labelKey="merge.success" />
      </div>
    </ToolPage>
  )
}
