import { fail, type Result } from './result'

/** Chamada de Server Action que pode lançar (rede, deploy no meio): vira Result para o formulário. */
export async function attempt<T>(action: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await action()
  } catch {
    return fail('network', 'Sem conexão ou erro inesperado. Tente de novo.')
  }
}
