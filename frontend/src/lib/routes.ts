/** Single source of truth for the public routes of the site. */

import { FileStack, Images, ImageDown, Lock, Minimize2, RotateCw, Scissors } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import routesData from '../../routes.json'

export interface RouteDefinition {
  path: string
  name: string
  prerender: boolean
  priority: string
  changefreq: string
}

export const ROUTES = routesData as RouteDefinition[]

/** Routes that are pre-rendered into static HTML at build time. */
export const PRERENDER_ROUTES = ROUTES.filter((route) => route.prerender).map((route) => route.path)

/** Navigation links used by the header, the mobile menu, the home grid and the footer. */
export interface NavLink {
  path: string
  labelKey: string
  descriptionKey?: string
  icon?: LucideIcon
}

/** A tool link always carries an icon and a description. */
export interface ToolLink {
  path: string
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
}

export const TOOL_LINKS: ToolLink[] = [
  {
    path: '/merge-pdf',
    labelKey: 'tools.mergePdf.title',
    descriptionKey: 'tools.mergePdf.desc',
    icon: FileStack,
  },
  {
    path: '/split-pdf',
    labelKey: 'tools.splitPdf.title',
    descriptionKey: 'tools.splitPdf.desc',
    icon: Scissors,
  },
  {
    path: '/compress-pdf',
    labelKey: 'tools.compressPdf.title',
    descriptionKey: 'tools.compressPdf.desc',
    icon: Minimize2,
  },
  {
    path: '/images-to-pdf',
    labelKey: 'tools.imagesToPdf.title',
    descriptionKey: 'tools.imagesToPdf.desc',
    icon: Images,
  },
  {
    path: '/pdf-to-images',
    labelKey: 'tools.pdfToImages.title',
    descriptionKey: 'tools.pdfToImages.desc',
    icon: ImageDown,
  },
  {
    path: '/rotate-pdf',
    labelKey: 'tools.rotatePdf.title',
    descriptionKey: 'tools.rotatePdf.desc',
    icon: RotateCw,
  },
  {
    path: '/protect-pdf',
    labelKey: 'tools.protectPdf.title',
    descriptionKey: 'tools.protectPdf.desc',
    icon: Lock,
  },
]

export const COMPANY_LINKS: NavLink[] = [
  { path: '/about', labelKey: 'nav.about', icon: undefined },
  { path: '/contact', labelKey: 'nav.contact', icon: undefined },
]

export const LEGAL_LINKS: NavLink[] = [
  { path: '/privacy', labelKey: 'nav.privacy', icon: undefined },
  { path: '/terms', labelKey: 'nav.terms', icon: undefined },
]
