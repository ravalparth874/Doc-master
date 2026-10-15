/** Client side limits, kept in sync with the backend defaults. */

/** Mirrors the `MAX_FILE_MB` environment variable on the server. */
export const MAX_FILE_MB = 25

/** Mirrors the `MAX_FILES` environment variable on the server. */
export const MAX_FILES = 20

export const PDF_ACCEPT = 'application/pdf,.pdf'
export const IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
