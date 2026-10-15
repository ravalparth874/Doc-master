/** Renders a JSON-LD block so search engines can understand the page. */

import type { JsonLdObject } from '../lib/seo'

interface JsonLdProps {
  data: JsonLdObject | JsonLdObject[]
}

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={`${String(index)}-${JSON.stringify(entry).length}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}
