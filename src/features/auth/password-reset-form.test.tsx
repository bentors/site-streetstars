import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendPasswordResetEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/firebase-client', () => ({ clientAuth: () => ({}) }))
vi.mock('firebase/auth', () => ({ sendPasswordResetEmail }))

import { PasswordResetForm } from './password-reset-form'

const SENT = /Se houver uma conta com esse e-mail/

beforeEach(() => vi.clearAllMocks())

async function submit(email = 'ana@b.com') {
  render(<PasswordResetForm />)
  await userEvent.type(screen.getByLabelText('E-mail'), email)
  await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))
}

describe('PasswordResetForm', () => {
  it('envia o link com volta para o login', async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined)
    await submit(' ana@b.com ')
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'ana@b.com', {
      url: `${window.location.origin}/entrar`,
    })
    expect(await screen.findByText(SENT)).toBeInTheDocument()
  })

  it('conta inexistente mostra a mesma confirmação', async () => {
    sendPasswordResetEmail.mockRejectedValue({ code: 'auth/user-not-found' })
    await submit()
    expect(await screen.findByText(SENT)).toBeInTheDocument()
  })

  it('e-mail inválido mostra erro', async () => {
    sendPasswordResetEmail.mockRejectedValue({ code: 'auth/invalid-email' })
    await submit('x@y')
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
  })
})
