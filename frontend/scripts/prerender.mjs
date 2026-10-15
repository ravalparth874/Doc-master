/**
 * Build time pre-renderer.
 *
 * Imports the SSR bundle produced by `vite build --ssr src/prerender.tsx`, renders
 * every route from `routes.json` and writes `dist/<route>/index.html` so crawlers
 * receive real HTML. The backend serves these files and falls back to
 * `dist/index.html` for anything not pre-rendered.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const distDir = resolve(root, 'dist')
const ssrDir = resolve(root, 'dist-ssr')

if (!existsSync(distDir)) {
  console.error('dist/ is missing. Run "vite build" first.')
  process.exit(1)
}

if (!existsSync(ssrDir)) {
  console.error('dist-ssr/ is missing. Run "vite build --ssr src/prerender.tsx" first.')
  process.exit(1)
}

const entry = readdirSync(ssrDir).find((file) => file.startsWith('prerender.'))
if (!entry) {
  console.error(`No prerender entry found in ${ssrDir}.`)
  process.exit(1)
}

const { render } = await import(pathToFileURL(join(ssrDir, entry)).href)
const routes = JSON.parse(readFileSync(resolve(root, 'routes.json'), 'utf8'))
const template = readFileSync(resolve(distDir, 'index.html'), 'utf8')

const BASELINE_PATTERN = /<!--seo-baseline-start-->[\s\S]*?<!--seo-baseline-end-->\s*/
const HEAD_MARKER = /<!--\s*seo-baseline-start\s*-->/
const HTML_MARKER = '<!--app-html-->'

if (!HEAD_MARKER.test(template)) {
  console.error('index.html is missing the <!--seo-baseline-start--> marker.')
  process.exit(1)
}
if (!template.includes(HTML_MARKER)) {
  console.error('index.html is missing the <!--app-html--> marker inside #root.')
  process.exit(1)
}

let written = 0
for (const route of routes) {
  if (route.prerender === false) {
    continue
  }

  const { html, head } = await render(route.path)
  const page = template
    .replace(BASELINE_PATTERN, head ? `${head}\n    ` : '')
    .replace(HTML_MARKER, html)

  const directory = route.path === '/' ? distDir : resolve(distDir, route.path.slice(1))
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'index.html'), page, 'utf8')
  written += 1
  console.log(`Prerendered ${route.path} (${html.length} bytes of markup)`)
}

console.log(`Prerendered ${written} routes into ${distDir}`)