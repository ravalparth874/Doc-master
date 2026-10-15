/**
 * Build time pre-render entry.
 *
 * `scripts/prerender.mjs` imports this module from the SSR bundle, renders every
 * public route to HTML and writes one `index.html` per route, so search engines
 * receive real content instead of an empty root div.
 */

import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import type { HelmetServerState } from 'react-helmet-async'

import { App } from './App'
import { fallbackRoute, ssrRoutes } from './router/ssrRoutes'

export interface RenderResult {
  html: string
  head: string
}

/** Render one route into HTML plus the head tags produced by Helmet. */
export async function render(url: string): Promise<RenderResult> {
  const helmetContext: { helmet?: HelmetServerState } = {}

  const markup = renderToString(
    <HelmetProvider context={helmetContext}>
      <MemoryRouter initialEntries={[url]}>
        <App routes={ssrRoutes} fallbackRoute={fallbackRoute} />
      </MemoryRouter>
    </HelmetProvider>,
  )

  const helmet = helmetContext.helmet
  const head = [helmet?.title, helmet?.meta, helmet?.link, helmet?.style]
    .map((part) => part?.toString() ?? '')
    .filter((part) => part.length > 0)
    .join('\n    ')

  return { html: markup, head }
}
