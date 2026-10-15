/**
 * Reorderable list of selected files.
 *
 * On a desktop the rows can be dragged with a mouse. Touch browsers do not
 * support HTML5 drag events, so on a phone the handle is hidden and the up and
 * down buttons become the way to reorder, which is also the keyboard friendly
 * path.
 */

import { useState } from 'react'
import type { DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react'

import { useIsTouchDevice } from '../hooks/useIsTouch'
import { formatBytes } from '../lib/config'

interface FileListProps {
  files: File[]
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
  orderable?: boolean
  disabled?: boolean
}

export function FileList({
  files,
  onRemove,
  onMove,
  orderable = false,
  disabled = false,
}: FileListProps) {
  const { t } = useTranslation()
  const isTouch = useIsTouchDevice()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const canDrag = orderable && !disabled && !isTouch
  const showHandle = orderable && !isTouch

  const handleDrop = (event: DragEvent<HTMLLIElement>, target: number) => {
    event.preventDefault()
    if (dragIndex !== null && dragIndex !== target) {
      onMove(dragIndex, target)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  if (files.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t('uploader.empty')}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
        <span aria-live="polite">{t('uploader.selectedCount', { count: files.length })}</span>
        {orderable ? (
          <span className={canDrag ? 'hidden sm:inline' : ''}>{t('uploader.reorderHint')}</span>
        ) : null}
      </div>

      <ul className="space-y-2">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${file.size}-${index}`}
            draggable={canDrag}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => {
              if (!canDrag) return
              event.preventDefault()
              setOverIndex(index)
            }}
            onDragLeave={() => setOverIndex((current) => (current === index ? null : current))}
            onDrop={(event) => handleDrop(event, index)}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={`flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2.5 text-sm transition sm:gap-3 sm:px-3 dark:bg-slate-900 ${
              overIndex === index
                ? 'border-brand-500 ring-2 ring-brand-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {showHandle ? (
              <GripVertical
                aria-hidden="true"
                size={18}
                className="hidden shrink-0 cursor-grab text-slate-400 sm:block dark:text-slate-500"
              />
            ) : null}

            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
                <span className="sr-only">{`${index + 1}. `}</span>
                {file.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatBytes(file.size)}
              </span>
            </span>

            {orderable ? (
              <span className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  className="btn-ghost btn-icon"
                  onClick={() => onMove(index, index - 1)}
                  disabled={disabled || index === 0}
                  aria-label={`${t('uploader.moveUp')}: ${file.name}`}
                >
                  <ArrowUp aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-icon"
                  onClick={() => onMove(index, index + 1)}
                  disabled={disabled || index === files.length - 1}
                  aria-label={`${t('uploader.moveDown')}: ${file.name}`}
                >
                  <ArrowDown aria-hidden="true" size={18} />
                </button>
              </span>
            ) : null}

            <button
              type="button"
              className="btn-ghost btn-icon text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => onRemove(index)}
              disabled={disabled}
              aria-label={`${t('uploader.remove')}: ${file.name}`}
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
