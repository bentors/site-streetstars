import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/server/db/firebase-admin'
import { getOrder, linkGuestOrders, listUserOrders } from '@/server/db/orders'
import { orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

const customer = orderDoc().customer

async function seed(id: string, overrides: Parameters<typeof orderDoc>[0] = {}) {
  await db().doc(`orders/${id}`).set(orderDoc(overrides))
}

describe('linkGuestOrders', () => {
  it('vincula só os pedidos sem conta com o mesmo e-mail, ignorando maiúsculas', async () => {
    await seed('guest', { customer: { ...customer, uid: null, email: 'ana@exemplo.com' } })
    await seed('other-account', { customer: { ...customer, uid: 'u2', email: 'ana@exemplo.com' } })
    await seed('other-email', { customer: { ...customer, uid: null, email: 'bia@exemplo.com' } })

    expect(await linkGuestOrders('u1', ' Ana@Exemplo.com ')).toBe(1)
    expect((await getOrder('guest'))?.customer.uid).toBe('u1')
    expect((await getOrder('other-account'))?.customer.uid).toBe('u2')
    expect((await getOrder('other-email'))?.customer.uid).toBeNull()
  })

  it('rodar de novo não vincula nada', async () => {
    await seed('guest')
    await linkGuestOrders('u1', customer.email)
    expect(await linkGuestOrders('u1', customer.email)).toBe(0)
  })
})

describe('listUserOrders', () => {
  it('lista só os pedidos da conta, do mais novo para o mais antigo', async () => {
    const at = (iso: string) => new Date(iso)
    await seed('old', {
      number: 'SS-1001',
      customer: { ...customer, uid: 'u1' },
      createdAt: at('2026-10-01T00:00:00Z'),
    })
    await seed('new', {
      number: 'SS-1002',
      customer: { ...customer, uid: 'u1' },
      createdAt: at('2026-10-10T00:00:00Z'),
    })
    await seed('someone-else', { number: 'SS-1003', customer: { ...customer, uid: 'u2' } })

    expect((await listUserOrders('u1')).map((order) => order.id)).toEqual(['new', 'old'])
  })
})
