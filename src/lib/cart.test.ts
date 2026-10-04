import { describe, expect, it } from 'vitest'
import {
  addLine,
  cartCount,
  lineKey,
  MAX_LINES,
  parseCart,
  removeLine,
  sanitizeLines,
  serializeCart,
  setLineQty,
  type CartLine,
} from './cart'

const tee = { productId: 'p1', size: 'M', color: 'Preto' }

describe('addLine', () => {
  it('soma quantidade da mesma combinação e separa combinações diferentes', () => {
    let lines: CartLine[] = []
    lines = addLine(lines, tee)
    lines = addLine(lines, tee, 2)
    lines = addLine(lines, { ...tee, size: 'G' })
    expect(lines).toEqual([
      { ...tee, qty: 3 },
      { ...tee, size: 'G', qty: 1 },
    ])
  })

  it('não passa de 10 unidades por linha', () => {
    expect(addLine([{ ...tee, qty: 9 }], tee, 5)).toEqual([{ ...tee, qty: 10 }])
  })
})

describe('setLineQty / removeLine', () => {
  const lines = [{ ...tee, qty: 2 }]
  const key = lineKey(tee)

  it('altera, limita e remove com zero', () => {
    expect(setLineQty(lines, key, 5)[0]?.qty).toBe(5)
    expect(setLineQty(lines, key, 50)[0]?.qty).toBe(10)
    expect(setLineQty(lines, key, 0)).toEqual([])
  })

  it('remove pela chave', () => {
    expect(removeLine(lines, key)).toEqual([])
  })
})

describe('parseCart / sanitizeLines', () => {
  it('lê o que foi gravado', () => {
    const lines = [{ ...tee, qty: 2 }]
    expect(parseCart(serializeCart(lines))).toEqual(lines)
  })

  it('aguenta lixo e adulteração', () => {
    expect(parseCart(null)).toEqual([])
    expect(parseCart('{não é json')).toEqual([])
    expect(parseCart('{"items": 1}')).toEqual([])
    expect(
      sanitizeLines([
        { productId: 'p1', size: 'M', color: null, qty: 999 },
        { productId: 'p2', size: 'M', color: null, qty: -3 },
        { productId: '', size: 'M', color: null, qty: 1 },
        { productId: 'p3', size: 'M', qty: 1 },
        'texto',
      ]),
    ).toEqual([{ productId: 'p1', size: 'M', color: null, qty: 10 }])
  })

  it('junta linhas repetidas e limita a quantidade de linhas', () => {
    const repeated = sanitizeLines([
      { ...tee, qty: 4 },
      { ...tee, qty: 4 },
    ])
    expect(repeated).toEqual([{ ...tee, qty: 8 }])
    const many = Array.from({ length: 40 }, (_, i) => ({
      productId: `p${i}`,
      size: 'M',
      color: null,
      qty: 1,
    }))
    expect(sanitizeLines(many)).toHaveLength(MAX_LINES)
  })
})

describe('cartCount', () => {
  it('soma as quantidades', () => {
    expect(
      cartCount([
        { ...tee, qty: 2 },
        { ...tee, size: 'G', qty: 3 },
      ]),
    ).toBe(5)
  })
})
