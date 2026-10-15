/** Browser entry point. */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { I18nextProvider } from 'react-i18next'

import '@fontsource-variable/inter'
import './index.css'

import { App } from './App'
import i18n from './i18n'
import { applyDocumentLanguage } from './i18n'
import { loadAnalytics } from './lib/analytics'
import { applyTheme, storedTheme } from './lib/theme'
import { appRoutes, fallbackRoute } from './router/clientRoutes'

applyTheme(storedTheme())
applyDocumentLanguage(i18n.language)
loadAnalytics()

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element not found')
}

const tree = (
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <BrowserRouter>
          <App routes={appRoutes} fallbackRoute={fallbackRoute} />
        </BrowserRouter>
      </HelmetProvider>
    </I18nextProvider>
  </StrictMode>
)

// The build ships pre-rendered HTML for crawlers. Rendering the app again (rather
// than hydrating) keeps the markup in charge and avoids any mismatch warnings.
createRoot(container).render(tree)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' })
  })
}
