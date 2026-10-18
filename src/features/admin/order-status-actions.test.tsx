import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const actions = vi.hoisted(() => ({
  transitionOrderAction: vi.fn(),
  resendShippedEmailAction: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./order-actions', () => actions)

import { OrderStatusActions } from './order-status-actions'

beforeEach(() => {
  vi.clearAllMocks()
  actions.transitionOrderAction.mockResolvedValue({ ok: true, data: { emailSent: true } })
  actions.resendShippedEmailAction.mockResolvedValue({ ok: true, data: null })
})

describe('OrderStatusActions', () => {
  it('mostra só os destinos permitidos', () => {
    render(
      <OrderStatusActions
        orderId="o1"
        targets={['shipped', 'refunded']}
        shippedEmailPending={false}
      />,
    )
    expect(screen.getByRole('button', { name: 'Marcar como Enviado' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar como Estornado' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cancelado/ })).not.toBeInTheDocument()
  })

  it('enviado pede o código e envia', async () => {
    render(<OrderStatusActions orderId="o1" targets={['shipped']} shippedEmailPending={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como Enviado' }))
    await userEvent.type(screen.getByLabelText('Código de rastreio'), 'ab123456789br')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(actions.transitionOrderAction).toHaveBeenCalledWith('o1', {
      to: 'shipped',
      trackingCode: 'ab123456789br',
      note: '',
    })
    expect(router.refresh).toHaveBeenCalled()
  })

  it('e-mail que não saiu vira aviso', async () => {
    actions.transitionOrderAction.mockResolvedValue({ ok: true, data: { emailSent: false } })
    render(<OrderStatusActions orderId="o1" targets={['shipped']} shippedEmailPending={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como Enviado' }))
    await userEvent.type(screen.getByLabelText('Código de rastreio'), 'AB123456789BR')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(/o e-mail ao cliente não saiu/)).toBeInTheDocument()
  })

  it('erro do servidor aparece e nada recarrega', async () => {
    actions.transitionOrderAction.mockResolvedValue({
      ok: false,
      code: 'invalid_transition',
      message: 'Não é possível passar de "Enviado" para "Em produção". Recarregue a página.',
    })
    render(<OrderStatusActions orderId="o1" targets={['cancelled']} shippedEmailPending={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como Cancelado' }))
    await userEvent.type(screen.getByLabelText('Observação (obrigatória)'), 'Cliente desistiu')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(/Recarregue a página/)).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('observação de uma transição não vai para a próxima', async () => {
    render(
      <OrderStatusActions
        orderId="o1"
        targets={['in_production', 'shipped']}
        shippedEmailPending={false}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como Em produção' }))
    await userEvent.type(screen.getByLabelText('Observação (opcional)'), 'Tecido chegou')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Marcar como Enviado' }))
    expect(screen.getByLabelText('Observação (opcional)')).toHaveValue('')
  })

  it('reenvia o e-mail pendente', async () => {
    render(<OrderStatusActions orderId="o1" targets={['delivered']} shippedEmailPending />)
    await userEvent.click(screen.getByRole('button', { name: 'Reenviar e-mail de envio' }))
    expect(actions.resendShippedEmailAction).toHaveBeenCalledWith('o1')
  })
})
