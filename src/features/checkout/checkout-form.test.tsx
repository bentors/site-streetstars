import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  lookupCepAction: vi.fn(),
  quoteShippingAction: vi.fn(),
  previewCouponAction: vi.fn(),
  createOrderAction: vi.fn(),
}))
const priceCartAction = vi.hoisted(() => vi.fn())
const redirectTo = vi.hoisted(() => vi.fn())
vi.mock('./actions', () => actions)
vi.mock('@/features/cart/actions', () => ({ priceCartAction }))
vi.mock('@/lib/navigate', () => ({ redirectTo }))

import { CartProvider } from '@/features/cart/cart-context'
import type { SavedAddress } from '@/lib/account'
import { CART_STORAGE_KEY } from '@/lib/cart'
import { CheckoutForm } from './checkout-form'

const line = { productId: 'p1', size: 'M', color: 'Preto', qty: 2 }
const priced = {
  lines: [
    {
      key: 'p1|M|Preto',
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
  ],
  removedKeys: [],
  subtotalCents: 29980,
}
const options = [
  {
    serviceId: 1,
    name: 'PAC',
    company: 'Correios',
    priceCents: 2500,
    deliveryDays: 8,
    productionDays: 10,
    totalDays: 18,
  },
  {
    serviceId: 2,
    name: 'SEDEX',
    company: 'Correios',
    priceCents: 4000,
    deliveryDays: 3,
    productionDays: 10,
    totalDays: 13,
  },
]
const defaults = {
  email: 'ana@exemplo.com',
  name: 'Ana Souza',
  phone: '11987654321',
  cpf: '52998224725',
}

function renderCheckout(
  cart: unknown[] = [line],
  props: Partial<React.ComponentProps<typeof CheckoutForm>> = {},
) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  return render(
    <CartProvider>
      <CheckoutForm defaults={defaults} {...props} />
    </CartProvider>,
  )
}

async function fillAddress() {
  const user = userEvent.setup()
  await screen.findByText('Camiseta')
  await user.type(screen.getByLabelText('CEP'), '01001000')
  await screen.findByRole('radio', { name: /SEDEX/ })
  await user.type(screen.getByLabelText('Número'), '100')
  return user
}

const payButton = () => screen.getByRole('button', { name: 'Ir para o pagamento' })

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  priceCartAction.mockResolvedValue(priced)
  actions.lookupCepAction.mockResolvedValue({
    ok: true,
    data: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' },
  })
  actions.quoteShippingAction.mockResolvedValue({ ok: true, data: options })
})

describe('checkout', () => {
  it('sacola vazia não mostra o formulário', () => {
    renderCheckout([])
    expect(screen.getByText('Sua sacola está vazia.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ir para o pagamento' })).not.toBeInTheDocument()
  })

  it('pré-preenche o contato de quem está logado', async () => {
    renderCheckout()
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@exemplo.com')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 98765-4321')
    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
  })

  it('o CEP preenche o endereço e mostra o frete com o prazo total', async () => {
    renderCheckout()
    await fillAddress()
    expect(actions.lookupCepAction).toHaveBeenCalledWith('01001000')
    expect(actions.quoteShippingAction).toHaveBeenCalledWith('01001000', [line])
    expect(screen.getByLabelText('Rua')).toHaveValue('Praça da Sé')
    expect(screen.getByLabelText('UF')).toHaveValue('SP')
    expect(screen.getByRole('radio', { name: /PAC/ })).toHaveAccessibleName(/até 18 dias úteis/i)
  })

  it('cria o pedido, limpa a sacola e vai para o pagamento', async () => {
    actions.createOrderAction.mockResolvedValue({
      ok: true,
      data: { redirectUrl: 'https://mp.test/init' },
    })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.click(payButton())

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('https://mp.test/init'))
    expect(actions.createOrderAction).toHaveBeenCalledWith({
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
      lines: [line],
      customer: {
        email: 'ana@exemplo.com',
        name: 'Ana Souza',
        phone: '(11) 98765-4321',
        cpf: '529.982.247-25',
      },
      address: {
        cep: '01001-000',
        street: 'Praça da Sé',
        number: '100',
        complement: '',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      serviceId: 2,
      couponCode: null,
      saveAddress: false,
    })
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')).toEqual([])
  })

  it('reenviar o mesmo pedido reaproveita a chave; mudar o frete gera outra', async () => {
    actions.createOrderAction.mockResolvedValue({
      ok: false,
      code: 'payment_unavailable',
      message: 'Não foi possível abrir o pagamento.',
    })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))

    await user.click(payButton())
    expect(await screen.findByText('Não foi possível abrir o pagamento.')).toBeInTheDocument()
    await waitFor(() => expect(payButton()).toBeEnabled())
    await user.click(payButton())
    await waitFor(() => expect(actions.createOrderAction).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(payButton()).toBeEnabled())
    await user.click(screen.getByRole('radio', { name: /PAC/ }))
    await user.click(payButton())
    await waitFor(() => expect(actions.createOrderAction).toHaveBeenCalledTimes(3))

    const keys = actions.createOrderAction.mock.calls.map(([input]) => input.idempotencyKey)
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[0])
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('não envia com CPF inválido e mostra o erro no campo', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /PAC/ }))
    await user.clear(screen.getByLabelText('CPF'))
    await user.type(screen.getByLabelText('CPF'), '11111111111')
    await user.click(payButton())
    expect(await screen.findByText('CPF inválido')).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('exige escolher o frete', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(payButton())
    expect(await screen.findByText('Escolha uma opção de frete.')).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('Enter no cupom aplica o cupom e não vai para o pagamento', async () => {
    actions.previewCouponAction.mockResolvedValue({
      ok: true,
      data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
    })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo{Enter}')
    expect(actions.previewCouponAction).toHaveBeenCalledWith('bemvindo', [line])
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('cupom digitado e não aplicado bloqueia o pagamento', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo')
    await user.click(payButton())
    expect(
      await screen.findByText('Aplique o cupom ou apague o campo antes de pagar.'),
    ).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('resposta antiga do CEP não sobrescreve a do CEP corrigido', async () => {
    let releaseOld: (value: unknown) => void = () => {}
    actions.lookupCepAction
      .mockImplementationOnce(() => new Promise((resolve) => (releaseOld = resolve)))
      .mockResolvedValueOnce({
        ok: true,
        data: { street: 'Rua Nova', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ' },
      })
    renderCheckout()
    const user = userEvent.setup()
    await screen.findByText('Camiseta')
    await user.type(screen.getByLabelText('CEP'), '01001000')
    await user.clear(screen.getByLabelText('CEP'))
    await user.type(screen.getByLabelText('CEP'), '20040002')
    await waitFor(() => expect(screen.getByLabelText('Rua')).toHaveValue('Rua Nova'))
    releaseOld({
      ok: true,
      data: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' },
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua Nova')
  })

  it('cupom inválido mostra o motivo; válido entra no resumo', async () => {
    actions.previewCouponAction
      .mockResolvedValueOnce({ ok: false, code: 'coupon_expired', message: 'Este cupom expirou.' })
      .mockResolvedValueOnce({
        ok: true,
        data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
      })
    renderCheckout()
    const user = userEvent.setup()
    await screen.findByText('Camiseta')

    await user.type(screen.getByLabelText('Cupom'), 'velho')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('Este cupom expirou.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Cupom'))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText(/^− R\$\s29,98$/)).toBeInTheDocument()
    expect(actions.previewCouponAction).toHaveBeenLastCalledWith('bemvindo', [line])
  })
})

const saved = (id: string, overrides: Partial<SavedAddress> = {}): SavedAddress => ({
  id,
  label: 'Casa',
  isDefault: false,
  cep: '20040002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'RJ',
  ...overrides,
})

describe('endereços salvos', () => {
  it('começa com o endereço padrão e troca pelo seletor', async () => {
    renderCheckout([line], {
      signedIn: true,
      addresses: [
        saved('a1', { label: 'Casa' }),
        saved('a2', { label: 'Trampo', number: '99', isDefault: true }),
      ],
    })
    expect(screen.getByLabelText('Número')).toHaveValue('99')
    expect(screen.getByLabelText('CEP')).toHaveValue('20040-002')

    await userEvent.selectOptions(screen.getByLabelText('Endereço salvo'), 'a1')
    expect(screen.getByLabelText('Número')).toHaveValue('10')
    await waitFor(() => expect(actions.quoteShippingAction).toHaveBeenCalled())
  })

  it('escolher endereço salvo cota o frete sem trocar a rua pelo ViaCEP', async () => {
    actions.lookupCepAction.mockResolvedValue({
      ok: true,
      data: { street: '', neighborhood: '', city: 'Cidade Pequena', state: 'MG' },
    })
    renderCheckout([line], {
      signedIn: true,
      addresses: [saved('a1', { isDefault: true }), saved('a2', { street: 'Rua Minha' })],
    })
    await userEvent.selectOptions(screen.getByLabelText('Endereço salvo'), 'a2')
    await waitFor(() => expect(actions.quoteShippingAction).toHaveBeenCalled())
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua Minha')
    expect(screen.getByLabelText('Bairro')).toHaveValue('Centro')
    expect(actions.lookupCepAction).not.toHaveBeenCalled()
  })

  it('CEP digitado sem rua no ViaCEP não apaga o que já foi preenchido', async () => {
    actions.lookupCepAction.mockResolvedValue({
      ok: true,
      data: { street: '', neighborhood: '', city: 'Cidade Pequena', state: 'MG' },
    })
    renderCheckout()
    const user = userEvent.setup()
    await screen.findByText('Camiseta')
    await user.type(screen.getByLabelText('Rua'), 'Rua Única')
    await user.type(screen.getByLabelText('CEP'), '35000000')
    await waitFor(() => expect(screen.getByLabelText('Cidade')).toHaveValue('Cidade Pequena'))
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua Única')
  })

  it('"Outro endereço" limpa os campos', async () => {
    renderCheckout([line], { signedIn: true, addresses: [saved('a1', { isDefault: true })] })
    await userEvent.selectOptions(screen.getByLabelText('Endereço salvo'), '')
    expect(screen.getByLabelText('Rua')).toHaveValue('')
  })

  it('sem login não mostra seletor nem "salvar endereço"', () => {
    renderCheckout()
    expect(screen.queryByLabelText('Endereço salvo')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Salvar este endereço/)).not.toBeInTheDocument()
  })

  it('logado sem endereços: "salvar endereço" já vem marcado', () => {
    renderCheckout([line], { signedIn: true, addresses: [] })
    expect(screen.getByLabelText(/Salvar este endereço/)).toBeChecked()
  })

  it('trocar só "salvar endereço" reaproveita a mesma chave de idempotência', async () => {
    actions.createOrderAction.mockResolvedValue({
      ok: false,
      code: 'payment_unavailable',
      message: 'Tente de novo.',
    })
    renderCheckout([line], { signedIn: true, addresses: [] })
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.click(payButton())
    await screen.findByText('Tente de novo.')
    await user.click(screen.getByLabelText(/Salvar este endereço/))
    await user.click(payButton())

    await waitFor(() => expect(actions.createOrderAction).toHaveBeenCalledTimes(2))
    const [first, second] = actions.createOrderAction.mock.calls.map(([input]) => input)
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
    expect([first.saveAddress, second.saveAddress]).toEqual([true, false])
  })
})
