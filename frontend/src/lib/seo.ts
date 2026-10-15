/**
 * Site metadata helpers shared by every page.
 *
 * The pre-rendered HTML is built before a domain is known, so canonical URLs use
 * a placeholder origin. The FastAPI backend swaps the placeholder for the real
 * `SITE_URL` while it serves the files, so canonical tags stay correct in every
 * environment without rebuilding the frontend.
 */

export const TOKEN_ORIGIN = 'https://docmaster.example'

export const SITE_NAME = 'DOC Master'

export const TAGLINE = 'All your PDF tools in one place. Free, fast and private.'

/** The public origin of the site. */
export function siteOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return TOKEN_ORIGIN
}

/** Absolute URL for a route, used for canonical links and Open Graph tags. */
export function absoluteUrl(path: string): string {
  const suffix = path === '/' ? '/' : path.replace(/\/$/, '')
  return `${siteOrigin()}${suffix}`
}

/** Share image used by Open Graph and Twitter cards. */
export const OG_IMAGE = `${siteOrigin()}/og-image.png`

export interface JsonLdObject {
  [key: string]: unknown
}

/** Build a `BreadcrumbList` for a tool page. */
export function breadcrumbLd(name: string, path: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
    ],
  }
}

export interface FaqEntry {
  question: string
  answer: string
}

/** Build a `FAQPage` schema from question/answer pairs. */
export function faqLd(faqs: FaqEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

/** Build the `WebApplication` schema used on the home page. */
export function webApplicationLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript.',
    description:
      'Free online PDF toolkit to merge, split, compress, rotate, convert and password protect PDF files without signup.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'Merge PDF files',
      'Split PDF pages',
      'Compress PDF to a target size',
      'Convert images to PDF',
      'Convert PDF to images',
      'Rotate PDF pages',
      'Protect and unlock PDFs',
    ],
  }
}

/** Build an `Organization` schema for the legal pages. */
export function organizationLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: TAGLINE,
  }
}
