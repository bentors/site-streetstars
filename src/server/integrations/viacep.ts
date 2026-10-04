import 'server-only'
import { z } from 'zod'

export type CepAddress = { street: string; neighborhood: string; city: string; state: string }

const responseSchema = z.union([
  z.object({ erro: z.union([z.literal(true), z.literal('true')]) }),
  z.object({
    logradouro: z.string(),
    bairro: z.string(),
    localidade: z.string(),
    uf: z.string().length(2),
  }),
])

/** `cep` já normalizado (8 dígitos). `null` = CEP não existe. */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`ViaCEP respondeu ${response.status}`)
  const data = responseSchema.parse(await response.json())
  if ('erro' in data) return null
  return {
    street: data.logradouro,
    neighborhood: data.bairro,
    city: data.localidade,
    state: data.uf,
  }
}
