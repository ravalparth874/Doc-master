/**
 * Typed client for the DOC Master API.
 *
 * Uploads use XMLHttpRequest because it is the only browser API that reports
 * upload progress. Nothing is ever persisted: the response blob is handed to the
 * caller and can be released as soon as the download starts.
 */

/**
 * Base URL of the DOC Master API.
 *
 * Defaults to `/api`, which is correct when FastAPI serves this frontend (and in
 * development, where Vite proxies `/api` to the local backend). When the two are
 * deployed separately, set `VITE_API_URL` to the backend origin at build time,
 * for example `https://doc-master-api.onrender.com`.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** Error carrying the friendly `detail` message returned by the backend. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Progress callback receiving a percentage between 0 and 100. */
export type ProgressHandler = (percent: number) => void

interface UploadOptions {
  data?: Record<string, string | number | undefined>
  files?: File[]
  onProgress?: ProgressHandler
  signal?: AbortSignal
}

function buildForm(options: UploadOptions): FormData {
  const form = new FormData()
  for (const file of options.files ?? []) {
    form.append('files', file, file.name)
  }
  for (const [key, value] of Object.entries(options.data ?? {})) {
    if (value !== undefined) {
      form.append(key, String(value))
    }
  }
  return form
}

function parseError(response: Response): Promise<ApiError> {
  return response
    .json()
    .then((payload: unknown) => {
      const detail =
        typeof payload === 'object' && payload !== null && 'detail' in payload
          ? String((payload as { detail: unknown }).detail)
          : 'Something went wrong. Please try again.'
      return new ApiError(detail, response.status)
    })
    .catch(() => new ApiError('Something went wrong. Please try again.', response.status))
}

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, init).then((response) => {
    if (!response.ok) {
      return parseError(response).then((error) => Promise.reject(error))
    }
    return response
  })
}

function upload<T>(path: string, options: UploadOptions, result: (blob: Blob) => T): Promise<T> {
  const form = buildForm(options)

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)
    xhr.responseType = 'blob'

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100)
        resolve(result(xhr.response))
        return
      }
      const blob = xhr.response instanceof Blob ? xhr.response : null
      if (!blob) {
        reject(new ApiError('Something went wrong. Please try again.', xhr.status))
        return
      }
      blob
        .text()
        .then((text) => {
          try {
            const payload = JSON.parse(text) as { detail?: string }
            reject(new ApiError(payload.detail ?? 'Something went wrong.', xhr.status))
          } catch {
            reject(new ApiError('Something went wrong. Please try again.', xhr.status))
          }
        })
        .catch(() => reject(new ApiError('Something went wrong. Please try again.', xhr.status)))
    })

    xhr.addEventListener('error', () =>
      reject(new ApiError('Network error. Please check your connection.')),
    )
    xhr.addEventListener('abort', () => reject(new ApiError('The upload was cancelled.')))

    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(form)
  })
}

/** Result of a tool call: the produced file and a name for the download. */
export interface ToolResult {
  blob: Blob
  filename: string
  contentType: string
}

function pdfResult(blob: Blob, filename: string): ToolResult {
  return { blob, filename, contentType: 'application/pdf' }
}

function zipResult(blob: Blob, filename: string): ToolResult {
  return { blob, filename, contentType: 'application/zip' }
}

export const api = {
  /** Liveness probe, used by the status badge in the footer. */
  health(signal?: AbortSignal): Promise<{ status: string }> {
    return request('/health', { signal }).then(
      (response) => response.json() as Promise<{ status: string }>,
    )
  },

  /** Merge several PDFs, in the order the files were added. */
  merge(files: File[], onProgress?: ProgressHandler, signal?: AbortSignal): Promise<ToolResult> {
    return upload('/merge', { files, onProgress, signal }, (blob) => pdfResult(blob, 'merged.pdf'))
  },

  /** Extract a page range into a new PDF. */
  split(
    file: File,
    range: { start: number; end: number },
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/split',
      { files: [file], data: { mode: 'range', ...range }, onProgress, signal },
      (blob) => pdfResult(blob, 'split.pdf'),
    )
  },

  /** Export every page as its own PDF inside a ZIP file. */
  splitAll(file: File, onProgress?: ProgressHandler, signal?: AbortSignal): Promise<ToolResult> {
    return upload('/split', { files: [file], data: { mode: 'all' }, onProgress, signal }, (blob) =>
      zipResult(blob, 'split-pages.zip'),
    )
  },

  /** Compress with a quality level and an optional strict size target. */
  compress(
    file: File,
    level: 'low' | 'medium' | 'high',
    targetKb: number | undefined,
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/compress',
      { files: [file], data: { level, target_kb: targetKb }, onProgress, signal },
      (blob) => pdfResult(blob, 'compressed.pdf'),
    )
  },

  /** Combine JPG/PNG images into one PDF. */
  imagesToPdf(
    files: File[],
    pageSize: 'a4' | 'letter' | 'original',
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/images-to-pdf',
      { files, data: { page_size: pageSize }, onProgress, signal },
      (blob) => pdfResult(blob, 'images.pdf'),
    )
  },

  /** Render each page to an image and pack them in a ZIP file. */
  pdfToImages(
    file: File,
    format: 'jpeg' | 'png',
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/pdf-to-images',
      { files: [file], data: { format }, onProgress, signal },
      (blob) => zipResult(blob, 'pdf-images.zip'),
    )
  },

  /** Rotate all pages or a selection such as `1,3-5`. */
  rotate(
    file: File,
    degrees: 90 | 180 | 270,
    pages: string,
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/rotate',
      { files: [file], data: { degrees, pages }, onProgress, signal },
      (blob) => pdfResult(blob, 'rotated.pdf'),
    )
  },

  /** Add a password to a PDF. */
  protect(
    file: File,
    password: string,
    confirmPassword: string,
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload(
      '/protect',
      { files: [file], data: { password, confirm_password: confirmPassword }, onProgress, signal },
      (blob) => pdfResult(blob, 'protected.pdf'),
    )
  },

  /** Remove the password from a PDF. */
  unlock(
    file: File,
    password: string,
    onProgress?: ProgressHandler,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    return upload('/unlock', { files: [file], data: { password }, onProgress, signal }, (blob) =>
      pdfResult(blob, 'unlocked.pdf'),
    )
  },

  /** Send the contact form message. */
  contact(payload: {
    name: string
    email: string
    message: string
    company?: string
  }): Promise<{ ok: boolean; message: string }> {
    return request('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then((response) => response.json() as Promise<{ ok: boolean; message: string }>)
  },
}
