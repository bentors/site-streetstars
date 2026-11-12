import { describe, expect, it } from 'vitest'
import { createOrderToken, readOrderToken } from './order-token'

const SECRET = 's'.repeat(32)

describe('link de acesso do pedido', () => {
  it('ida e volta devolve o id do pedido', () => {
    const token = createOrderToken('Ab12Cd34', SECRET)
    expect(token).toMatch(/^Ab12Cd34\.[A-Za-z0-9_-]{43}$/)
    expect(readOrderToken(token, SECRET)).toBe('Ab12Cd34')
  })

  it('é sempre o mesmo para o mesmo pedido (o webhook recalcula para o e-mail)', () => {
    expect(createOrderToken('o1', SECRET)).toBe(createOrderToken('o1', SECRET))
  })

  it('recusa assinatura de outro segredo', () => {
    expect(readOrderToken(createOrderToken('o1', 'o'.repeat(32)), SECRET)).toBeNull()
  })

  it('recusa trocar o id mantendo a assinatura', () => {
    const [, mac] = createOrderToken('o1', SECRET).split('.')
    expect(readOrderToken(`o2.${mac}`, SECRET)).toBeNull()
  })

  it.each(['', 'o1', 'o1.', '.abc', 'o1.abc.def', 'o/1.abc', 'o1.' + 'a'.repeat(43)])(
    'recusa %j',
    (token) => {
      expect(readOrderToken(token, SECRET)).toBeNull()
    },
  )
})
