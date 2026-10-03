import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const firebase = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
const signInAction = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/firebase-client', () => ({ clientAuth: () => ({}) }))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
  ...firebase,
}))
vi.mock('./actions', () => ({ signInAction }))

import { SignInForm } from './sign-in-form'

const user = { getIdToken: vi.fn().mockResolvedValue('id-token') }

beforeEach(() => vi.clearAllMocks())

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('E-mail'), ' ana@b.com ')
  await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('SignInForm', () => {
  it('cria a sessão e vai para o destino', async () => {
    firebase.signInWithEmailAndPassword.mockResolvedValue({ user })
    signInAction.mockResolvedValue({ ok: true, data: null })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'ana@b.com', 'segredo123')
    expect(signInAction).toHaveBeenCalledWith('id-token')
    expect(firebase.signOut).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/conta')
  })

  it('mostra o erro do servidor e não navega', async () => {
    firebase.signInWithEmailAndPassword.mockResolvedValue({ user })
    signInAction.mockResolvedValue({
      ok: false,
      code: 'rate_limited',
      message: 'Muitas tentativas. Aguarde um minuto.',
    })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Muitas tentativas. Aguarde um minuto.',
    )
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('traduz erro de credencial do Firebase', async () => {
    firebase.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(signInAction).not.toHaveBeenCalled()
  })

  it('entra com Google', async () => {
    firebase.signInWithPopup.mockResolvedValue({ user })
    signInAction.mockResolvedValue({ ok: true, data: null })
    render(<SignInForm next="/admin" />)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }))

    expect(firebase.signInWithPopup).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/admin')
  })
})
