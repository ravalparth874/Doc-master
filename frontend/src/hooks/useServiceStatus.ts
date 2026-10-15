/**
 * Reports whether the API is reachable, so the footer can show a live status.
 *
 * The result is cached in `sessionStorage` for a minute so navigating between
 * pages does not fire a request on every render.
 */

import { useEffect, useState } from 'react'

import { api } from '../api'

export type ServiceStatus = 'unknown' | 'ok' | 'down'

const CACHE_KEY = 'doc-master-health'
const TTL_MS = 60_000

function readCache(): { at: number; status: ServiceStatus } | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { at: number; status: ServiceStatus }
    if (Date.now() - parsed.at > TTL_MS) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(status: ServiceStatus): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), status }))
  } catch {
    // Storage can be blocked; the check simply runs again on the next page.
  }
}

export function useServiceStatus(): ServiceStatus {
  const [status, setStatus] = useState<ServiceStatus>('unknown')

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      setStatus(cached.status)
      return undefined
    }

    const controller = new AbortController()
    api
      .health(controller.signal)
      .then(() => {
        setStatus('ok')
        writeCache('ok')
      })
      .catch(() => {
        setStatus('down')
        writeCache('down')
      })

    return () => controller.abort()
  }, [])

  return status
}
