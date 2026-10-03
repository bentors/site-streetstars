export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Falha na subida se faltar alguma variável, em vez de quebrar numa requisição.
  const { serverEnv } = await import('./server/env')
  const { publicEnv } = await import('./lib/env')
  serverEnv()
  publicEnv()
}
