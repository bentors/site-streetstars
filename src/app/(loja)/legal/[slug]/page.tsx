import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui'
import { publicEnv } from '@/lib/env'
import { fillLegalText, isLegalSlug, LEGAL_PAGES } from '@/lib/legal'
import { getCachedStoreSettings } from '@/server/catalog'

export const revalidate = 3600
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isLegalSlug(slug)) return {}
  const page = LEGAL_PAGES[slug]
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/legal/${slug}` },
    robots: { index: false, follow: true },
  }
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isLegalSlug(slug)) notFound()
  const page = LEGAL_PAGES[slug]
  const settings = await getCachedStoreSettings()
  const siteHost = new URL(publicEnv().NEXT_PUBLIC_SITE_URL).host

  return (
    <Container className="max-w-3xl pt-32 pb-20">
      <h1 className="mb-8 border-b border-line pb-6 text-3xl font-black uppercase italic md:text-5xl">
        {page.title}
      </h1>
      <article className="text-sm leading-relaxed whitespace-pre-line text-paper/70">
        {fillLegalText(page.text, settings, siteHost)}
      </article>
    </Container>
  )
}
