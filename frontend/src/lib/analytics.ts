/**
 * Optional analytics.
 *
 * When the frontend is served by FastAPI the backend injects the snippet while
 * it serves the page. With a static host such as Vercel nothing injects it, so
 * the loader below reads `VITE_ANALYTICS_ID` from the build and adds the same
 * snippet. Both paths set `data-analytics` on the tag they create, and the
 * loader does nothing if that marker is already present.
 */

const MARKER = 'data-analytics'

/** True when an analytics snippet was already injected. */
function alreadyInjected(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  return document.querySelector(`script[${MARKER}]`) !== null
}

function appendScript(src: string, attributes: Record<string, string>): void {
  const script = document.createElement('script')
  script.setAttribute(MARKER, 'true')
  for (const [name, value] of Object.entries(attributes)) {
    script.setAttribute(name, value)
  }
  script.src = src
  script.async = true
  document.head.appendChild(script)
}

function preconnect(href: string): void {
  if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
    return
  }
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = href
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

function loadGoogleAnalytics(id: string): void {
  preconnect('https://www.googletagmanager.com')
  appendScript(`https://www.googletagmanager.com/gtag/js?id=${id}`, {})

  const init = document.createElement('script')
  init.setAttribute(MARKER, 'init')
  init.textContent =
    'window.dataLayer=window.dataLayer||[];' +
    'function gtag(){dataLayer.push(arguments)}' +
    'gtag("js",new Date());' +
    `gtag("config","${id}");`
  document.head.appendChild(init)
}

function loadPlausible(domain: string): void {
  preconnect('https://plausible.io')
  const script = document.createElement('script')
  script.setAttribute(MARKER, 'true')
  script.setAttribute('data-domain', domain)
  script.src = 'https://plausible.io/js/script.js'
  script.defer = true
  document.head.appendChild(script)
}

/** Inject the configured analytics provider, if any. */
export function loadAnalytics(): void {
  const id = import.meta.env.VITE_ANALYTICS_ID?.trim()
  if (!id || alreadyInjected() || typeof document === 'undefined') {
    return
  }

  if (id.startsWith('G-')) {
    loadGoogleAnalytics(id)
    return
  }

  // Anything else is treated as the domain reported by Plausible.
  const domain = id.includes('.') ? id : window.location.hostname
  loadPlausible(domain)
}
