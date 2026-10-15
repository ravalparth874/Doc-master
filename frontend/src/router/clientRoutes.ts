/**
 * Route table for the browser build.
 *
 * Every page except the home page is loaded on demand so the first paint only
 * downloads what a visitor actually needs. The pre-render build uses
 * `router.ssr.tsx`, which imports the same pages eagerly.
 */

import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

import { ROUTES } from '../lib/routes'
import NotFound from '../pages/NotFound'

export interface AppRoute {
  path: string
  Component: ComponentType
}

type PageModule = { default: ComponentType }

const loaders: Record<string, () => Promise<PageModule>> = {
  '/': () => import('../pages/Home'),
  '/merge-pdf': () => import('../pages/tools/MergePdf'),
  '/split-pdf': () => import('../pages/tools/SplitPdf'),
  '/compress-pdf': () => import('../pages/tools/CompressPdf'),
  '/images-to-pdf': () => import('../pages/tools/ImagesToPdf'),
  '/pdf-to-images': () => import('../pages/tools/PdfToImages'),
  '/rotate-pdf': () => import('../pages/tools/RotatePdf'),
  '/protect-pdf': () => import('../pages/tools/ProtectPdf'),
  '/about': () => import('../pages/About'),
  '/privacy': () => import('../pages/Privacy'),
  '/terms': () => import('../pages/Terms'),
  '/contact': () => import('../pages/Contact'),
}

function lazyRoute(loader: () => Promise<PageModule>): LazyExoticComponent<ComponentType> {
  return lazy(loader)
}

export const appRoutes: AppRoute[] = ROUTES.map((route) => ({
  path: route.path,
  Component: loaders[route.path] ? lazyRoute(loaders[route.path]) : NotFound,
}))

export const fallbackRoute: AppRoute = { path: '*', Component: NotFound }
