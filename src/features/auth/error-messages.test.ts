import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './error-messages'

describe('authErrorMessage', () => {
  it.each(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'])(
    'não revela se o e-mail existe (%s)',
    (code) => {
      expect(authErrorMessage(code)).toBe('E-mail ou senha incorretos.')
    },
  )

  it('ignora popup fechado pelo usuário', () => {
    expect(authErrorMessage('auth/popup-closed-by-user')).toBeNull()
    expect(authErrorMessage('auth/cancelled-popup-request')).toBeNull()
  })

  it('traduz bloqueio por excesso de tentativas', () => {
    expect(authErrorMessage('auth/too-many-requests')).toBe(
      'Muitas tentativas. Tente novamente em alguns minutos.',
    )
  })

  it('tem mensagem genérica para o resto', () => {
    expect(authErrorMessage('auth/qualquer-coisa')).toBe(
      'Não foi possível entrar. Tente novamente.',
    )
  })
})
