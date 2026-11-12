import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const updateProfileAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => router,
}))
vi.mock('./actions', () => ({ updateProfileAction }))

import { ProfileForm } from './profile-form'

const initial = { name: 'Ana', phone: '11987654321', cpf: '', marketingConsent: false }

beforeEach(() => {
  vi.clearAllMocks()
  updateProfileAction.mockResolvedValue({ ok: true, data: null })
})

describe('ProfileForm', () => {
  it('mostra os dados formatados e salva', async () => {
    render(<ProfileForm initial={initial} />)
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 98765-4321')

    await userEvent.type(screen.getByLabelText('CPF'), '52998224725')
    await userEvent.click(screen.getByLabelText(/novidades/))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(updateProfileAction).toHaveBeenCalledWith({
      name: 'Ana',
      phone: '(11) 98765-4321',
      cpf: '529.982.247-25',
      marketingConsent: true,
    })
    expect(await screen.findByText('Dados salvos.')).toBeInTheDocument()
    expect(router.refresh).toHaveBeenCalled()
  })

  it('CPF inválido mostra erro no campo e não envia', async () => {
    render(<ProfileForm initial={initial} />)
    await userEvent.type(screen.getByLabelText('CPF'), '123')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('CPF inválido')).toBeInTheDocument()
    expect(updateProfileAction).not.toHaveBeenCalled()
  })

  it('erro de rede mostra a mensagem e mantém o que foi digitado', async () => {
    updateProfileAction.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<ProfileForm initial={initial} />)
    await userEvent.clear(screen.getByLabelText('Nome completo'))
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana Maria')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Sem conexão/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Maria')
  })
})
