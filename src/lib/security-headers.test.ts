import { describe, expect, it } from 'vitest'
import { securityHeaders } from './security-headers'

const csp = (isDev: boolean) =>
  securityHeaders({ isDev }).find((h) => h.key === 'Content-Security-Policy')?.value ?? ''

describe('securityHeaders', () => {
  it('bloqueia o site em iframes e restringe objetos', () => {
    expect(csp(false)).toContain("frame-ancestors 'none'")
    expect(csp(false)).toContain("object-src 'none'")
  })

  it('libera o popup do Google e o Cloudinary', () => {
    expect(csp(false)).toContain('https://*.firebaseapp.com')
    expect(csp(false)).toContain('https://apis.google.com')
    expect(csp(false)).toContain('https://res.cloudinary.com')
  })

  it("só usa 'unsafe-eval' em desenvolvimento (React Refresh)", () => {
    expect(csp(false)).not.toContain("'unsafe-eval'")
    expect(csp(true)).toContain("'unsafe-eval'")
  })

  it('inclui os headers de proteção básicos', () => {
    const keys = securityHeaders({ isDev: false }).map((h) => h.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ]),
    )
  })
})
