import { describe, expect, it } from 'vitest'
import { adminAlertEmail } from './admin-alert'
import { adminNewOrderEmail } from './admin-new-order'
import type { EmailOrder } from './layout'
import { orderConfirmationEmail } from './order-confirmation'
import { orderShippedEmail } from './order-shipped'

const order: EmailOrder = {
  number: 'SS-1001',
  customer: {
    uid: null,
    email: 'ana@exemplo.com',
    name: 'Ana Souza',
    phone: '11987654321',
    cpf: '52998224725',
  },
  items: [
    {
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: '',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
  ],
  totals: { subtotalCents: 29980, discountCents: 2998, shippingCents: 2500, totalCents: 29482 },
  shipping: {
    serviceId: 1,
    name: 'PAC',
    company: 'Correios',
    priceCents: 2500,
    deliveryDays: 8,
    productionDays: 10,
  },
  shippingAddress: {
    cep: '20040002',
    street: 'Rua da Assembleia',
    number: '10',
    complement: 'Sala 2',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  coupon: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
}

describe('e-mail de confirmação', () => {
  it('tem número, prazo, link, itens, totais e endereço', () => {
    const email = orderConfirmationEmail(order, 'https://loja.test/pedido/o1.mac')
    expect(email.subject).toBe('Pedido SS-1001 confirmado')
    expect(email.html).toContain('Oi, Ana!')
    expect(email.html).toContain('até 18 dias úteis')
    expect(email.html).toContain('href="https://loja.test/pedido/o1.mac"')
    expect(email.html).toContain('Tam. M · Preto · Qtd. 2')
    expect(email.html).toMatch(/Cupom BEMVINDO/)
    expect(email.html).toMatch(/R\$\s294,82/)
    expect(email.html).toContain('CEP 20040-002')
  })

  it('escapa o que veio do cliente', () => {
    const email = orderConfirmationEmail(
      { ...order, customer: { ...order.customer, name: '<script>x</script> Souza' } },
      'https://loja.test/pedido/a.b?x=1&y=2',
    )
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).toContain('href="https://loja.test/pedido/a.b?x=1&amp;y=2"')
  })
})

describe('e-mails da loja', () => {
  it('novo pedido traz contato, CPF e frete para a etiqueta', () => {
    const email = adminNewOrderEmail(order)
    expect(email.subject).toMatch(/^Novo pedido pago SS-1001 · R\$\s294,82$/)
    expect(email.html).toContain('ana@exemplo.com')
    expect(email.html).toContain('(11) 98765-4321')
    expect(email.html).toContain('529.982.247-25')
    expect(email.html).toContain('PAC (Correios)')
  })

  it('alerta', () => {
    const email = adminAlertEmail({ orderNumber: 'SS-1001', message: 'Valor <divergente>' })
    expect(email.subject).toBe('Alerta no pedido SS-1001')
    expect(email.html).toContain('Valor &lt;divergente&gt;')
  })
})

describe('orderShippedEmail', () => {
  const tracking = {
    carrier: 'Correios',
    code: 'AB123456789BR',
    url: 'https://melhorrastreio.com.br/rastreio/AB123456789BR',
  }

  it('traz o código, o link de rastreio e o link do pedido', () => {
    const email = orderShippedEmail({ ...order, tracking }, 'https://loja.test/pedido/x.y')
    expect(email.subject).toBe('Pedido SS-1001 enviado')
    expect(email.html).toContain('AB123456789BR')
    expect(email.html).toContain('href="https://melhorrastreio.com.br/rastreio/AB123456789BR"')
    expect(email.html).toContain('href="https://loja.test/pedido/x.y"')
  })

  it('escapa o código', () => {
    const email = orderShippedEmail(
      { ...order, tracking: { ...tracking, code: '<b>X</b>' } },
      'https://loja.test',
    )
    expect(email.html).not.toContain('<b>X</b>')
  })
})
