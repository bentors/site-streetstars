import { describe, expect, it } from 'vitest'
import { checkoutAddressSchema, checkoutCustomerSchema, createOrderInputSchema } from './checkout'

const customer = {
  email: '  Ana@Exemplo.com ',
  name: ' Ana Souza ',
  phone: '(11) 98765-4321',
  cpf: '529.982.247-25',
}
const address = {
  cep: '20040-002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'rj',
}

describe('schemas do checkout', () => {
  it('normaliza contato e endereço', () => {
    expect(checkoutCustomerSchema.parse(customer)).toEqual({
      email: 'ana@exemplo.com',
      name: 'Ana Souza',
      phone: '11987654321',
      cpf: '52998224725',
    })
    expect(checkoutAddressSchema.parse(address)).toMatchObject({ cep: '20040002', state: 'RJ' })
  })

  it.each([
    ['email', { ...customer, email: 'ana@' }, 'E-mail inválido'],
    ['cpf', { ...customer, cpf: '111.111.111-11' }, 'CPF inválido'],
    ['phone', { ...customer, phone: '1234' }, 'Telefone inválido'],
    ['name', { ...customer, name: '   ' }, 'Obrigatório'],
  ])('contato: %s inválido', (field, input, message) => {
    const result = checkoutCustomerSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues.find((issue) => issue.path[0] === field)?.message).toBe(message)
  })

  it('endereço: CEP e UF inválidos', () => {
    const result = checkoutAddressSchema.safeParse({ ...address, cep: '123', state: 'R' })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['cep', 'state'])
  })

  it('a entrada do pedido descarta campos que o cliente não manda (preço, frete)', () => {
    const parsed = createOrderInputSchema.parse({
      idempotencyKey: '2f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b',
      lines: [],
      customer,
      address,
      serviceId: 1,
      couponCode: null,
      shippingPriceCents: 1,
      totals: { totalCents: 1 },
    })
    expect(parsed).not.toHaveProperty('shippingPriceCents')
    expect(parsed).not.toHaveProperty('totals')
  })
})
