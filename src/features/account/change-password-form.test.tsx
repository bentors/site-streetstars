import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const firebase = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  updatePassword: vi.fn(),
  signOut: vi.fn(),
}))
const signInAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/firebase-client', () => ({ clientAuth: () => ({}) }))
vi.mock('firebase/auth', () => firebase)
vi.mock('@/features/auth/actions', () => ({ signInAction }))

import { ChangePasswordForm } from './change-password-form'

const user = { getIdToken: vi.fn().mockResolvedValue('fresh-token') }

beforeEach(() => {
  vi.clearAllMocks()
  firebase.signInWithEmailAndPassword.mockResolvedValue({ user })
  firebase.updatePassword.mockResolvedValue(undefined)
  signInAction.mockResolvedValue({ ok: true, data: null })
})

async function fill(current: string, next: string, confirm = next) {
  render(<ChangePasswordForm email="ana@b.com" />)
  await userEvent.type(screen.getByLabelText('Senha atual'), current)
  await userEvent.type(screen.getByLabelText('Nova senha'), next)
  await userEvent.type(screen.getByLabelText('Repita a nova senha'), confirm)
  await userEvent.click(screen.getByRole('button', { name: 'Trocar senha' }))
}

describe('ChangePasswordForm', () => {
  it('reautentica, troca a senha e renova a sessão', async () => {
    await fill('antiga123', 'novinha456')
    expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'ana@b.com', 'antiga123')
    expect(firebase.updatePassword).toHaveBeenCalledWith(user, 'novinha456')
    expect(user.getIdToken).toHaveBeenCalledWith(true)
    expect(signInAction).toHaveBeenCalledWith('fresh-token')
    expect(firebase.signOut).toHaveBeenCalled()
    expect(await screen.findByText('Senha alterada.')).toBeInTheDocument()
  })

  it('senha atual errada: mensagem clara e nada muda', async () => {
    firebase.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' })
    await fill('errada123', 'novinha456')
    expect(await screen.findByText('Senha atual incorreta.')).toBeInTheDocument()
    expect(firebase.updatePassword).not.toHaveBeenCalled()
  })

  it('confirmação diferente não chega ao Firebase', async () => {
    await fill('antiga123', 'novinha456', 'novinha457')
    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument()
    expect(firebase.signInWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('nova senha fraca não chega ao Firebase', async () => {
    await fill('antiga123', 'curta1')
    expect(await screen.findByText('Use pelo menos 8 caracteres.')).toBeInTheDocument()
    expect(firebase.signInWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('se a sessão não renovar, manda entrar de novo', async () => {
    signInAction.mockResolvedValue({ ok: false, code: 'session_failed', message: 'x' })
    await fill('antiga123', 'novinha456')
    expect(router.replace).toHaveBeenCalledWith('/entrar?next=/conta/seguranca')
  })
})
