/**
 * Page level SEO tags.
 *
 * Titles, descriptions, canonical URLs and social cards come from here so every
 * page is unique. `react-helmet-async` writes them into the document, and the
 * same component is used during pre-rendering so crawlers receive real HTML.
 */

import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

import { absoluteUrl, OG_IMAGE, SITE_NAME, siteOrigin } from '../lib/seo'

export interface SeoProps {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

const SITE_URL = siteOrigin()

export function Seo({
  title,
  description,
  path,
  image = OG_IMAGE,
  type = 'website',
  noIndex,
}: SeoProps) {
  const canonical = absoluteUrl(path)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`

  useEffect(() => {
    // Remove the static fallback tags shipped in index.html so a page can never
    // end up with two descriptions or two canonical links.
    document.querySelectorAll('[data-static-seo]').forEach((element) => element.remove())
  }, [])

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta
        name="robots"
        content={noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}
      />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="author" content={SITE_NAME} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${path === '/' ? '/' : path}`} />
    </Helmet>
  )
}
