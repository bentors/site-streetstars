const WEAK = 'Senha fraca. Use pelo menos 8 caracteres, com letras e números.'

const messages: Record<string, string | null> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/email-already-in-use': 'Este e-mail já tem cadastro. Entre ou recupere sua senha.',
  'auth/weak-password': WEAK,
  'auth/password-does-not-meet-requirements': WEAK,
  'auth/requires-recent-login': 'Por segurança, entre de novo e repita a operação.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
}

export function authErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
}

/** null = erro que não merece mensagem (ex.: o próprio usuário fechou o pop-up). */
export function authErrorMessage(
  code: string,
  fallback = 'Não foi possível entrar. Tente novamente.',
): string | null {
  return code in messages ? (messages[code] ?? null) : fallback
}
