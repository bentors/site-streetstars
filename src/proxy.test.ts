import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from './proxy'

describe('proxy', () => {
  it('manda para /entrar com o destino quando não há cookie de sessão', () => {
    const response = proxy(new NextRequest('http://localhost:3000/admin/pedidos?status=paid'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/entrar?next=%2Fadmin%2Fpedidos%3Fstatus%3Dpaid',
    )
  })

  it('deixa passar quando há cookie (a validação real é no servidor)', () => {
    const request = new NextRequest('http://localhost:3000/conta', {
      headers: { cookie: '__session=abc' },
    })
    expect(proxy(request).headers.get('location')).toBeNull()
  })

  it('protege só /conta e /admin', () => {
    expect(config.matcher).toEqual(['/conta/:path*', '/admin/:path*'])
  })
})
