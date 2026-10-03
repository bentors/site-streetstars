import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import { timestampsToDates } from './convert'

describe('timestampsToDates', () => {
  it('converte Timestamps aninhados em objetos e arrays', () => {
    const at = new Date('2026-01-02T03:04:05.000Z')
    const input = {
      createdAt: Timestamp.fromDate(at),
      history: [{ at: Timestamp.fromDate(at), status: 'paid' }],
      name: 'x',
      count: 2,
      empty: null,
    }
    expect(timestampsToDates(input)).toEqual({
      createdAt: at,
      history: [{ at, status: 'paid' }],
      name: 'x',
      count: 2,
      empty: null,
    })
  })
})
