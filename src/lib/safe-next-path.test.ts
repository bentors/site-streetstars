import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  it.each([
    ['/conta', '/conta'],
    ['/admin/pedidos?status=paid', '/admin/pedidos?status=paid'],
    ['/produto/camiseta#medidas', '/produto/camiseta#medidas'],
  ])('mantém caminho interno %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', 'conta', ''])(
    'troca %s pelo fallback',
    (input) => {
      expect(safeNextPath(input, '/conta')).toBe('/conta')
    },
  )

  it.each(['/.//evil.com', '/a/..//evil.com', '/%2e//evil.com'])(
    'troca %s pelo fallback (segmentos de ponto viram //host)',
    (input) => {
      expect(safeNextPath(input, '/conta')).toBe('/conta')
    },
  )

  it('usa / como fallback padrão para null', () => {
    expect(safeNextPath(null)).toBe('/')
  })
})
