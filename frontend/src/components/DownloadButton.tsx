/**
 * Download button for a finished file.
 *
 * The object URL is created when the visitor asks for the file and revoked on
 * unmount, so the browser never keeps the processed document around.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Download } from 'lucide-react'

import type { ToolResult } from '../api'

interface DownloadButtonProps {
  result: ToolResult | null
  /** Translate the label, for example `merge.success`. */
  labelKey?: string
}

export function DownloadButton({ result, labelKey }: DownloadButtonProps) {
  const { t } = useTranslation()
  const [clicked, setClicked] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!result) {
      return undefined
    }
    const objectUrl = URL.createObjectURL(result.blob)
    setUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [result])

  useEffect(() => {
    setClicked(false)
  }, [result])

  // On a phone the result often appears below the fold, so bring it into view.
  useEffect(() => {
    if (result && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [result])

  const download = useCallback(() => {
    if (!url || !result) {
      return
    }
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = result.filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setClicked(true)
  }, [result, url])

  if (!result || !url) {
    return null
  }

  return (
    <div
      ref={panelRef}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-200">
        <CheckCircle2 aria-hidden="true" size={18} />
        {labelKey ? t(labelKey) : t('actions.download')}
      </p>
      <button type="button" onClick={download} className="btn-primary mt-3 w-full">
        <Download aria-hidden="true" size={18} />
        {clicked ? t('actions.downloadAgain') : t('actions.download')}
      </button>
    </div>
  )
}
