import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const firebase = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
  signOut: vi.fn(),
}))
const signUpAction = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/firebase-client', () => ({ clientAuth: () => ({}) }))
vi.mock('firebase/auth', () => firebase)
vi.mock('./actions', () => ({ signUpAction }))

import { SignUpForm } from './sign-up-form'

const user = { getIdToken: vi.fn().mockResolvedValue('id-token') }

beforeEach(() => {
  vi.clearAllMocks()
  firebase.createUserWithEmailAndPassword.mockResolvedValue({ user })
  firebase.sendEmailVerification.mockResolvedValue(undefined)
  signUpAction.mockResolvedValue({ ok: true, data: null })
})

async function fill({ password = 'estrela42', terms = true } = {}) {
  await userEvent.type(screen.getByLabelText('Nome'), 'Ana Souza')
  await userEvent.type(screen.getByLabelText('E-mail'), 'ana@b.com')
  await userEvent.type(screen.getByLabelText('Senha'), password)
  if (terms) await userEvent.click(screen.getByLabelText(/Li e aceito/))
  await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))
}

describe('SignUpForm', () => {
  it('cria a conta, envia a verificação e abre a sessão', async () => {
    render(<SignUpForm />)
    await fill()

    expect(firebase.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'ana@b.com',
      'estrela42',
    )
    expect(firebase.sendEmailVerification).toHaveBeenCalledWith(user, {
      url: `${window.location.origin}/entrar?next=/conta&confirmado=1`,
    })
    expect(signUpAction).toHaveBeenCalledWith('id-token', {
      name: 'Ana Souza',
      marketingConsent: false,
      acceptTerms: true,
    })
    expect(firebase.signOut).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/conta')
  })

  it('senha fraca não chega ao Firebase', async () => {
    render(<SignUpForm />)
    await fill({ password: 'abcdefgh' })
    expect(await screen.findByText('Use letras e números.')).toBeInTheDocument()
    expect(firebase.createUserWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('exige aceitar os termos', async () => {
    render(<SignUpForm />)
    await fill({ terms: false })
    expect(await screen.findByText('Aceite os termos para continuar.')).toBeInTheDocument()
    expect(firebase.createUserWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('e-mail já cadastrado mostra a mensagem certa', async () => {
    firebase.createUserWithEmailAndPassword.mockRejectedValue({
      code: 'auth/email-already-in-use',
    })
    render(<SignUpForm />)
    await fill()
    expect(
      await screen.findByText('Este e-mail já tem cadastro. Entre ou recupere sua senha.'),
    ).toBeInTheDocument()
    expect(signUpAction).not.toHaveBeenCalled()
  })

  it('falha ao enviar a verificação não impede o cadastro', async () => {
    firebase.sendEmailVerification.mockRejectedValue({ code: 'auth/too-many-requests' })
    render(<SignUpForm />)
    await fill()
    expect(router.replace).toHaveBeenCalledWith('/conta')
  })
})
