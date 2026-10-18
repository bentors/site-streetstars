import { describe, expect, it } from 'vitest'
import { authErrorCode, authErrorMessage } from './error-messages'

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

  it('usa o fallback informado para códigos desconhecidos', () => {
    expect(authErrorMessage('auth/xyz', 'Não foi possível criar a conta.')).toBe(
      'Não foi possível criar a conta.',
    )
  })

  it('extrai o código de erros do Firebase', () => {
    expect(authErrorCode({ code: 'auth/weak-password' })).toBe('auth/weak-password')
    expect(authErrorCode(new Error('x'))).toBe('')
  })
})
