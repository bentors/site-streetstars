const messages: Record<string, string | null> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
}

export function authErrorMessage(code: string): string | null {
  return code in messages ? (messages[code] ?? null) : 'Não foi possível entrar. Tente novamente.'
}
