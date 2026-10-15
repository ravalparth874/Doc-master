/**
 * Route table used by the build time pre-render.
 *
 * `renderToString` cannot resolve a `React.lazy` component, so this module
 * imports every page directly. It is only part of the SSR bundle.
 */

import type { ComponentType } from 'react'

import { ROUTES } from '../lib/routes'
import About from '../pages/About'
import Contact from '../pages/Contact'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import Privacy from '../pages/Privacy'
import Terms from '../pages/Terms'
import CompressPdf from '../pages/tools/CompressPdf'
import ImagesToPdf from '../pages/tools/ImagesToPdf'
import MergePdf from '../pages/tools/MergePdf'
import PdfToImages from '../pages/tools/PdfToImages'
import ProtectPdf from '../pages/tools/ProtectPdf'
import RotatePdf from '../pages/tools/RotatePdf'
import SplitPdf from '../pages/tools/SplitPdf'

import type { AppRoute } from './clientRoutes'

const pages: Record<string, ComponentType> = {
  '/': Home,
  '/merge-pdf': MergePdf,
  '/split-pdf': SplitPdf,
  '/compress-pdf': CompressPdf,
  '/images-to-pdf': ImagesToPdf,
  '/pdf-to-images': PdfToImages,
  '/rotate-pdf': RotatePdf,
  '/protect-pdf': ProtectPdf,
  '/about': About,
  '/privacy': Privacy,
  '/terms': Terms,
  '/contact': Contact,
}

export const ssrRoutes: AppRoute[] = ROUTES.map((route) => ({
  path: route.path,
  Component: pages[route.path] ?? NotFound,
}))

export const fallbackRoute: AppRoute = { path: '*', Component: NotFound }
