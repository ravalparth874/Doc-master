/**
 * Ordered file list used by the tools that accept more than one file.
 *
 * Keeps the selection in React state, enforces the same limits as the backend
 * and exposes add/remove/move helpers so pages never duplicate that logic.
 */

import { useCallback, useMemo, useState } from 'react'

import { MAX_FILES, MAX_FILE_MB } from '../lib/config'

export interface AddResult {
  added: number
  skippedTooLarge: number
  skippedTooMany: number
}

export interface FileListController {
  files: File[]
  totalSize: number
  add: (incoming: File[]) => AddResult
  remove: (index: number) => void
  move: (from: number, to: number) => void
  reset: () => void
  isFull: boolean
}

export function useFileList(): FileListController {
  const [files, setFiles] = useState<File[]>([])

  const add = useCallback((incoming: File[]): AddResult => {
    let skippedTooLarge = 0
    let skippedTooMany = 0
    let added = 0

    setFiles((current) => {
      const next = [...current]
      for (const file of incoming) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          skippedTooLarge += 1
          continue
        }
        if (next.length >= MAX_FILES) {
          skippedTooMany += 1
          continue
        }
        next.push(file)
        added += 1
      }
      return next
    })

    return { added, skippedTooLarge, skippedTooMany }
  }, [])

  const remove = useCallback((index: number) => {
    setFiles((current) => current.filter((_, position) => position !== index))
  }, [])

  const move = useCallback((from: number, to: number) => {
    setFiles((current) => {
      if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) {
        return current
      }
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const reset = useCallback(() => setFiles([]), [])

  const totalSize = useMemo(() => files.reduce((total, file) => total + file.size, 0), [files])

  return { files, totalSize, add, remove, move, reset, isFull: files.length >= MAX_FILES }
}
