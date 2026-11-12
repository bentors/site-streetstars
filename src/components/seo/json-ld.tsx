import { jsonLdString } from '@/lib/json-ld'

export function JsonLd({ data }: { data: unknown }) {
  // O conteúdo é JSON serializado por jsonLdString, que escapa "<".
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
  )
}
