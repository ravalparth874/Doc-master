/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the API, for example https://doc-master-api.onrender.com.
   *  Leave unset when the frontend and the API share an origin. */
  readonly VITE_API_URL?: string
  /** Public origin of the site, used for canonical URLs and the sitemap.
   *  Leave unset when FastAPI serves the frontend and rewrites the origin. */
  readonly VITE_SITE_URL?: string
  /** Optional analytics id: `G-XXXXXXXXXX` for GA4, or a domain for Plausible. */
  readonly VITE_ANALYTICS_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
