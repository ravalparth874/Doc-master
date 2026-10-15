/**
 * Drag and drop file picker.
 *
 * The visible area is a real label pointing at a visually hidden file input, so
 * keyboard and screen reader users get the native file browser for free. Files
 * can also be dropped onto it from the desktop.
 */

import { useCallback, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, UploadCloud } from 'lucide-react'

interface DropzoneProps {
  multiple?: boolean
  accept: string
  onFiles: (files: File[]) => void
  disabled?: boolean
  /** Hint about the accepted types, shown under the title. */
  hint?: string
}

export function Dropzone({
  multiple = false,
  accept,
  onFiles,
  disabled = false,
  hint,
}: DropzoneProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const emit = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) {
        return
      }
      const files = Array.from(list)
      onFiles(multiple ? files : files.slice(0, 1))
    },
    [multiple, onFiles],
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    emit(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!disabled) {
      emit(event.dataTransfer.files)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    // Enter and Space open the picker when the label is focused directly.
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-disabled={disabled || undefined}
      aria-describedby={hint ? `${inputId}-hint` : undefined}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition select-none
        focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-3 sm:px-6 sm:py-10
        ${
          dragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/60 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white">
        <UploadCloud aria-hidden="true" size={24} />
      </span>

      <span className="block text-[15px] font-semibold text-balance text-slate-900 sm:text-base dark:text-white">
        {dragging ? t('uploader.dropHere') : t('uploader.dropTitle')}
      </span>

      <span className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-300">
        <FileUp aria-hidden="true" size={16} />
        {multiple ? t('uploader.browseMultiple') : t('uploader.browse')}
      </span>

      {hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      ) : null}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  )
}
