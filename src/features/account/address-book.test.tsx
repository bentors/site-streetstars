import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const actions = vi.hoisted(() => ({
  saveAddressAction: vi.fn(),
  deleteAddressAction: vi.fn(),
  setDefaultAddressAction: vi.fn(),
}))
const lookupCepAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./actions', () => actions)
vi.mock('@/features/checkout/actions', () => ({ lookupCepAction }))

import type { SavedAddress } from '@/lib/account'
import { AddressBook } from './address-book'

const home: SavedAddress = {
  id: 'a1',
  label: 'Casa',
  isDefault: true,
  cep: '20040002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'RJ',
}
const work: SavedAddress = { ...home, id: 'a2', label: 'Trampo', number: '20', isDefault: false }

beforeEach(() => {
  vi.clearAllMocks()
  for (const fn of Object.values(actions)) fn.mockResolvedValue({ ok: true, data: null })
  lookupCepAction.mockResolvedValue({
    ok: true,
    data: {
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
  })
})

describe('AddressBook', () => {
  it('lista os endereços e marca o padrão', () => {
    render(<AddressBook addresses={[home, work]} />)
    expect(screen.getByText('Casa')).toBeInTheDocument()
    expect(screen.getAllByText('Padrão')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Tornar padrão' })).toHaveLength(1)
  })

  it('novo endereço: o CEP preenche o resto e salva', async () => {
    render(<AddressBook addresses={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo endereço' }))
    await userEvent.type(screen.getByLabelText('CEP'), '01310100')
    await waitFor(() => expect(screen.getByLabelText('Rua')).toHaveValue('Avenida Paulista'))
    await userEvent.type(screen.getByLabelText('Número'), '1000')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }))

    expect(actions.saveAddressAction).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ cep: '01310-100', street: 'Avenida Paulista', number: '1000' }),
    )
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('editar envia o id; erro do servidor aparece', async () => {
    actions.saveAddressAction.mockResolvedValue({
      ok: false,
      code: 'not_found',
      message: 'Endereço não encontrado.',
    })
    render(<AddressBook addresses={[home]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar endereço' }))
    expect(actions.saveAddressAction).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ label: 'Casa' }),
    )
    expect(await screen.findByText('Endereço não encontrado.')).toBeInTheDocument()
  })

  it('excluir pede confirmação', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<AddressBook addresses={[home]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(actions.deleteAddressAction).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(actions.deleteAddressAction).toHaveBeenCalledWith('a1')
    confirm.mockRestore()
  })

  it('esconde "Novo endereço" no limite', () => {
    const full = Array.from({ length: 10 }, (_, i) => ({
      ...work,
      id: `x${i}`,
      isDefault: i === 0,
    }))
    render(<AddressBook addresses={full} />)
    expect(screen.queryByRole('button', { name: 'Novo endereço' })).not.toBeInTheDocument()
  })
})
