import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const retryPaymentAction = vi.hoisted(() => vi.fn())
const redirectTo = vi.hoisted(() => vi.fn())
const refresh = vi.hoisted(() => vi.fn())
vi.mock('./actions', () => ({ retryPaymentAction }))
vi.mock('@/lib/navigate', () => ({ redirectTo }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { OrderView, type OrderViewData } from './order-view'

const order: OrderViewData = {
  number: 'SS-1001',
  status: 'pending_payment',
  items: [
    {
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
  totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
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
    complement: '',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  tracking: null,
  coupon: null,
  payment: {
    preferenceId: 'pref',
    paymentId: null,
    status: null,
    method: null,
    paidAmountCents: null,
    paidAt: null,
  },
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => vi.useRealTimers())

describe('OrderView', () => {
  it('pendente: "Pagar agora" gera um link novo e vai para o Mercado Pago', async () => {
    retryPaymentAction.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test/2' } })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus={null} />)
    expect(screen.getByRole('heading', { name: 'Aguardando pagamento' })).toBeInTheDocument()
    expect(screen.getByText(/R\$\s324,80/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('https://mp.test/2'))
    expect(retryPaymentAction).toHaveBeenCalledWith('o1.mac')
  })

  it('erro ao gerar o link aparece na tela', async () => {
    retryPaymentAction.mockResolvedValue({ ok: false, code: 'x', message: 'Tente mais tarde.' })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente mais tarde.')
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('pendente fora do prazo: sem botão, com orientação', () => {
    render(
      <OrderView
        order={order}
        token="o1.mac"
        payable={false}
        helpUrl="https://wa.me/55"
        returnStatus={null}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Prazo de pagamento encerrado' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/55',
    )
  })

  it('enviado: mostra o rastreio', () => {
    render(
      <OrderView
        order={{
          ...order,
          status: 'shipped',
          tracking: { carrier: 'Correios', code: 'AA123456789BR', url: 'https://rastreio.test/AA' },
        }}
        token="o1.mac"
        payable={false}
        helpUrl={null}
        returnStatus={null}
      />,
    )
    expect(screen.getByText('AA123456789BR')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rastrear entrega' })).toHaveAttribute(
      'href',
      'https://rastreio.test/AA',
    )
  })

  it('atualiza a página enquanto aguarda o pagamento', () => {
    vi.useFakeTimers()
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus={null} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(refresh).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(11 * 60 * 1000))
    expect(refresh.mock.calls.length).toBeLessThan(125)
  })

  it('Pix gerado ou cartão em análise: sem "Pagar agora", com aviso de processamento', () => {
    render(
      <OrderView
        order={{ ...order, payment: { ...order.payment, paymentId: '9', status: 'pending' } }}
        token="o1.mac"
        payable
        helpUrl={null}
        returnStatus={null}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
    expect(screen.getByText(/aguardando a confirmação do Mercado Pago/)).toBeInTheDocument()
  })

  it('voltou do Mercado Pago aprovado antes do webhook: não oferece pagar de novo', () => {
    render(
      <OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus="approved" />,
    )
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
  })

  it('pagamento recusado: avisa e oferece tentar de novo', () => {
    render(
      <OrderView
        order={{ ...order, payment: { ...order.payment, paymentId: '9', status: 'rejected' } }}
        token="o1.mac"
        payable
        helpUrl={null}
        returnStatus={null}
      />,
    )
    expect(screen.getByText(/não foi aprovado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar agora' })).toBeInTheDocument()
  })

  it('"Pagar agora" continua carregando enquanto vai para o Mercado Pago', async () => {
    retryPaymentAction.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test' } })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    await waitFor(() => expect(redirectTo).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /Pagar agora/ })).toBeDisabled()
  })
})
