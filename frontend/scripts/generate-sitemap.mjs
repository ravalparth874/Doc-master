/**
 * Regenerates robots.txt and sitemap.xml from `routes.json`.
 *
 * Run with: npm run generate:assets
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

/** Fallback origin, rewritten by the backend when it serves the frontend. */
const TOKEN_ORIGIN = 'https://docmaster.example'

/**
 * Origin used inside robots.txt and sitemap.xml.
 *
 * On a static host (Vercel) this comes from VITE_SITE_URL or SITE_URL at build
 * time. When the frontend is served by FastAPI the placeholder origin is used
 * instead, and the backend swaps it for SITE_URL while it serves the file.
 */
const ORIGIN = (process.env.SITE_URL || process.env.VITE_SITE_URL || TOKEN_ORIGIN).replace(
  /\/$/,
  '',
)

const routesFile = resolve(root, 'routes.json')
const routes = JSON.parse(readFileSync(routesFile, 'utf8'))
const base = ORIGIN
const today = new Date().toISOString().slice(0, 10)

const entries = routes
  .map((route) => {
    const path = route.path === '/' ? '/' : route.path
    return [
      '  <url>',
      `    <loc>${base}${path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      '  </url>',
    ].join('\n')
  })
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`

const robots = `# DOC Master - robots.txt
# Your files are processed in memory and never stored.
User-agent: *
Allow: /

# API endpoints are not useful to crawlers
Disallow: /api/

Sitemap: ${base}/sitemap.xml
`

const targets = [resolve(root, 'public'), resolve(root, 'dist')].filter(existsSync)

if (targets.length === 0) {
  console.error('No public/ or dist/ directory found. Run this from the frontend folder.')
  process.exit(1)
}

for (const target of targets) {
  mkdirSync(target, { recursive: true })
  writeFileSync(resolve(target, 'sitemap.xml'), sitemap, 'utf8')
  writeFileSync(resolve(target, 'robots.txt'), robots, 'utf8')
  console.log(`Wrote sitemap.xml and robots.txt to ${target}`)
}