/** Navegação para fora do app (Mercado Pago). Isolada para os testes poderem simular. */
export function redirectTo(url: string): void {
  window.location.assign(url)
}
