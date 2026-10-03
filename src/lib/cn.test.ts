import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta classes e ignora valores falsos', () => {
    expect(cn('a', false, null, undefined, 'b', { c: true, d: false })).toBe('a b c')
  })
})
