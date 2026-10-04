import { describe, expect, it } from 'vitest'
import { buildRobots, buildSitemap } from './seo'

const site = 'https://streetstars.com.br'

describe('buildSitemap', () => {
  it('inclui home, produtos e coleções (páginas legais são noindex e ficam de fora)', () => {
    const sitemap = buildSitemap(site, {
      products: [{ slug: 'camiseta', updatedAt: '2026-10-01T00:00:00.000Z' }],
      collections: [{ slug: 'drop-1' }],
    })
    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://streetstars.com.br/',
      'https://streetstars.com.br/produto/camiseta',
      'https://streetstars.com.br/colecao/drop-1',
    ])
    expect(sitemap[1]?.lastModified).toBe('2026-10-01T00:00:00.000Z')
  })
})

describe('buildRobots', () => {
  it('bloqueia áreas privadas e aponta o sitemap', () => {
    const robots = buildRobots(site)
    expect(robots.rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/conta', '/checkout', '/pedido', '/entrar'],
    })
    expect(robots.sitemap).toBe('https://streetstars.com.br/sitemap.xml')
  })
})
