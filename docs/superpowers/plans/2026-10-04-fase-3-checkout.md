# Fase 3 — Checkout e pagamento: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vender de verdade: checkout em página única (contato, endereço com ViaCEP, frete do Melhor Envio, cupom), criação do pedido só no servidor, pagamento no Mercado Pago Checkout Pro, webhook idempotente, página `/pedido/[token]`, e-mails transacionais e expiração automática de pedidos não pagos.

**Architecture:** Regras de dinheiro e de status são funções puras em `src/server/domain/` (TDD). As integrações (`src/server/integrations/`) são clientes `fetch` finos com timeout, testados com `fetch` simulado. A orquestração fica em `src/server/checkout/` (criar pedido) e `src/server/orders/` (link de acesso, pagamento, webhook, e-mails, expiração), testada contra o emulador do Firestore com as integrações simuladas por `vi.mock`. Server Actions e Route Handlers só fazem rate limit, sessão e repasse. O link do pedido é `/pedido/<orderId>.<hmac>`: o servidor recalcula o HMAC a qualquer momento (inclusive no webhook, para o e-mail), então nenhum segredo por pedido precisa ser guardado.

**Tech Stack:** Next.js 16 (App Router, Server Actions, Route Handlers), React 19, TypeScript 5.9, zod 4, firebase-admin 14 (transações), Vitest 5 + Testing Library + emulador do Firestore. APIs externas via `fetch`: Mercado Pago (`/checkout/preferences`, `/v1/payments/{id}`), Melhor Envio (`/api/v2/me/shipment/calculate`), ViaCEP, Resend (`/emails`). Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md` (seções 3, 4, 8, 9 e 10)

## Global Constraints

- Tudo das Fases 1 e 2 continua valendo: TypeScript strict com `noUncheckedIndexedAccess`, alias `@/*`, `server-only` em `src/server/**`, dinheiro em centavos inteiros (`Cents`), mensagens ao usuário em português e sem detalhe interno, `Result<T>` (`ok`/`fail` de `@/lib/result`) para erros esperados, Conventional Commits em inglês sem atribuição a IA, sem `git push`.
- Lint do projeto: proibido `setState` síncrono dentro de `useEffect` (`react-hooks/set-state-in-effect`) e `new Date()`/`Date.now()` direto no corpo de componentes. Padrão aceito: `setState` depois de um `await` dentro de `startTransition`.
- Firestore não aceita `undefined`: campos opcionais (ex.: `note` do histórico) são omitidos, nunca gravados como `undefined`.
- Em transações do Firestore, todas as leituras vêm antes de qualquer escrita.
- Toda chamada externa usa `AbortSignal.timeout(...)`.
- **Pagamento (decisão do usuário):** só Pix e cartão. A preferência exclui `ticket` (boleto) e `atm` e limita a **6 parcelas**. A vitrine continua sem texto de parcelamento.
- **Frete (decisão do usuário):** só Correios PAC e SEDEX (`services: '1,2'` no Melhor Envio). Prazo exibido = `max(productionDays dos itens) + deliveryDays`, em dias úteis.
- **Logado (decisão do usuário):** o checkout só pré-preenche e-mail, nome, telefone e CPF e grava `customer.uid`. Escolher ou salvar endereços fica para a Fase 4.
- Pedido não pago expira em **48 h** (`expiresAt`); `expired` ainda aceita ir para `paid`.
- Primeiro número de pedido: **SS-1001** (`counters/orders.last` começa em 1000).
- Cupom percentual arredonda o desconto para baixo e vale só sobre o subtotal (nunca sobre o frete); desconto nunca passa do subtotal.
- Variáveis `MERCADOPAGO_*`, `MELHORENVIO_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM` e `CRON_SECRET` são obrigatórias só quando `VERCEL_ENV=production`; `ORDER_TOKEN_SECRET` é obrigatória sempre. Sem Resend configurado fora da produção, o e-mail só vai para o log.
- O `.env` antigo do app Vite (ignorado pelo git) ainda é carregado pelo Next e tem tokens com os mesmos nomes. **Não ler nem copiar valores dele.** O usuário confirma que os tokens em uso são de teste/sandbox antes de qualquer teste manual.
- Testes de emulador rodam com `make test-emulator`. Nesta máquina, antes de `make`: `export PATH="/c/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin:/c/Users/bento/AppData/Local/Microsoft/WinGet/Packages/ezwinports.make_Microsoft.Winget.Source_8wekyb3d8bbwe/bin:$PATH"`.
- Antes de `npm ci`/limpezas, conferir se `npm run dev` está rodando (Windows trava arquivos).
- Branch de trabalho: `refactor/nextjs`. Base da fase: `36ebace`.

## Review Focus

1. **Webhook entregue duas vezes, fora de ordem ou em paralelo:** o pedido vira `paid` uma vez só, o cupom conta um uso só e cada e-mail sai uma vez. Um "recusado" depois de "aprovado" não regride o pedido. Testado nas Tasks 9 e 10.
2. **Pagamento aprovado num pedido que não está esperando pagamento** (cancelado, já pago por outro pagamento): o status não muda, o histórico registra e o admin recebe alerta. Pedido `expired` vira `paid` normalmente. Testado nas Tasks 9 e 10.
3. **Clique duplo em "Ir para o pagamento", rede caindo, Mercado Pago fora do ar:** existe no máximo um pedido por tentativa (mesma `idempotencyKey`). O pedido pendente é reaproveitado ao tentar de novo, e mudar o pedido (frete, endereço, itens) gera chave nova. Testado nas Tasks 8 e 12.
4. **Entrada adulterada:** preço ou frete enviados pelo cliente, `serviceId` que o Melhor Envio não ofereceu, produto que virou rascunho e cupom que esgotou entre a prévia e o pagamento. O servidor recalcula tudo e recusa com mensagem clara. Testado na Task 8.
5. **Cupom de 100% ou desconto maior que o subtotal:** o desconto é limitado ao subtotal, o total fica igual ao frete e o Mercado Pago recebe um item com valor positivo (nunca R$ 0). Link de pedido adulterado ou de outro pedido dá 404. Testado nas Tasks 2, 3, 6 e 11.

## Estrutura de arquivos ao fim da fase

```
vercel.json                                    cron diário de expiração
firestore.indexes.json                         + orders(status, expiresAt)
src/
  lib/
    order-status.ts                            status, rótulos, isPaidStatus (cliente e servidor)
    checkout.ts (+ test)                       schemas zod da entrada do checkout, ShippingOption
    navigate.ts                                redirectTo (isolado para testes)
  emails/
    html.ts (+ test)                           template com escape automático
    layout.ts                                  documento e detalhes do pedido
    order-confirmation.ts · admin-new-order.ts · admin-alert.ts (+ emails.test.ts)
  server/
    env.ts (+ test)                            novas variáveis
    domain/
      order-status.ts (+ test)                 canTransition
      order-token.ts (+ test)                  createOrderToken / readOrderToken (HMAC)
      pricing.ts (+ test)                      computeTotals
      coupons.ts (+ test)                      applyCoupon, normalizeCouponCode
      shipping-estimate.ts (+ test)            cartPackage
      payment-outcome.ts (+ test)              decidePaymentOutcome
    db/
      orders.ts                                schema, repositório, numeração
      coupons.ts                               schema e getCouponRule
    integrations/
      melhorenvio.ts (+ test) · viacep.ts (+ test)
      mercadopago.ts (+ test) · mercadopago-signature.ts (+ test)
      resend.ts (+ test)
    checkout/
      cart.ts · shipping.ts · create-order.ts
    orders/
      access.ts · payment.ts · payment-notification.ts · order-emails.ts · expire-orders.ts
  features/
    cart/cart-context.tsx                      + clear()
    checkout/ actions.ts (+ test) · checkout-form.tsx (+ test)
    orders/ actions.ts · order-summary.tsx · order-view.tsx · pending-payment-watcher.tsx ·
            retry-payment-button.tsx (+ order-view.test.tsx)
  app/
    (loja)/checkout/page.tsx
    (loja)/pedido/[token]/page.tsx
    api/webhooks/mercadopago/route.ts (+ test)
    api/cron/expirar-pedidos/route.ts (+ test)
tests/integration/
  fixtures.ts · orders.test.ts · create-order.test.ts · payment-notification.test.ts · expire-orders.test.ts
```

---

### Task 1: Variáveis de ambiente da fase

**Files:**
- Modify: `src/server/env.ts`, `src/server/env.test.ts`, `.env.example`, `.github/workflows/ci.yml`, `tests/setup-integration.ts`, `scripts/doctor.sh`
- Local (não versionado): `.env.local`

**Interfaces:**
- Produces: `serverEnv()` passa a ter `ORDER_TOKEN_SECRET: string`, `MERCADOPAGO_ACCESS_TOKEN?: string`, `MERCADOPAGO_WEBHOOK_SECRET?: string`, `MELHORENVIO_TOKEN?: string`, `MELHORENVIO_ENV: 'sandbox' | 'production'`, `RESEND_API_KEY?: string`, `EMAIL_FROM?: string`, `CRON_SECRET?: string`, `VERCEL_ENV?: 'production' | 'preview' | 'development'`.

- [ ] **Step 1: Reescrever os testes do env**

`src/server/env.test.ts` (substitui o arquivo inteiro):

```ts
import { describe, expect, it } from 'vitest'
import { parseServerEnv } from './env'

const SECRET = 'x'.repeat(32)

const emulator = {
  NODE_ENV: 'test',
  FIREBASE_PROJECT_ID: 'demo-streetstars',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  ORDER_TOKEN_SECRET: SECRET,
}

const credentials = {
  FIREBASE_PROJECT_ID: 'street-stars-system',
  FIREBASE_CLIENT_EMAIL: 'sa@prod.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: 'key',
  ORDER_TOKEN_SECRET: SECRET,
}

const upstash = {
  UPSTASH_REDIS_REST_URL: 'https://x.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 't',
}

const integrations = {
  MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-1',
  MERCADOPAGO_WEBHOOK_SECRET: 'whsec',
  MELHORENVIO_TOKEN: 'me-token',
  RESEND_API_KEY: 're_1',
  EMAIL_FROM: 'Street Stars <pedidos@streetstars.com.br>',
  CRON_SECRET: 'c'.repeat(32),
}

describe('parseServerEnv', () => {
  it('aceita emulador sem credenciais', () => {
    const env = parseServerEnv(emulator)
    expect(env.FIREBASE_PROJECT_ID).toBe('demo-streetstars')
    expect(env.MELHORENVIO_ENV).toBe('sandbox')
  })

  it('exige credenciais quando não há emulador', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'development',
        FIREBASE_PROJECT_ID: 'street-stars-dev',
        ORDER_TOKEN_SECRET: SECRET,
      }),
    ).toThrow(/FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY/)
  })

  it('converte \n literais da chave privada em quebras de linha', () => {
    const env = parseServerEnv({
      ...credentials,
      NODE_ENV: 'development',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    })
    expect(env.FIREBASE_PRIVATE_KEY).toBe(
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    )
  })

  it('exige Upstash em produção', () => {
    expect(() => parseServerEnv({ ...credentials, NODE_ENV: 'production' })).toThrow(
      /UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/,
    )
  })

  it('exige o segredo dos links de pedido com 32 caracteres ou mais', () => {
    expect(() => parseServerEnv({ ...emulator, ORDER_TOKEN_SECRET: 'curto' })).toThrow(
      /ORDER_TOKEN_SECRET/,
    )
  })

  it('exige as integrações no deploy de produção da Vercel', () => {
    expect(() =>
      parseServerEnv({ ...credentials, ...upstash, NODE_ENV: 'production', VERCEL_ENV: 'production' }),
    ).toThrow(
      /MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET, MELHORENVIO_TOKEN, RESEND_API_KEY, EMAIL_FROM, CRON_SECRET/,
    )
  })

  it('preview e build local funcionam sem as integrações', () => {
    const env = parseServerEnv({ ...credentials, ...upstash, NODE_ENV: 'production', VERCEL_ENV: 'preview' })
    expect(env.MERCADOPAGO_ACCESS_TOKEN).toBeUndefined()
  })

  it('aceita produção completa', () => {
    const env = parseServerEnv({
      ...credentials,
      ...upstash,
      ...integrations,
      NODE_ENV: 'production',
      VERCEL_ENV: 'production',
      MELHORENVIO_ENV: 'production',
    })
    expect(env.MELHORENVIO_ENV).toBe('production')
  })
})
```

Run: `npm test -- src/server/env.test.ts` → Expected: FAIL (os campos novos não existem; `ORDER_TOKEN_SECRET` curto passa).

- [ ] **Step 2: Implementar**

Em `src/server/env.ts`, dentro do `z.object({...})`, depois de `UPSTASH_REDIS_REST_TOKEN`:

```ts
    VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
    ORDER_TOKEN_SECRET: z.string().min(32),
    MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
    MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
    MELHORENVIO_TOKEN: z.string().min(1).optional(),
    MELHORENVIO_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(16).optional(),
```

E no `superRefine`, depois do bloco de produção do Upstash:

```ts
    // Só o deploy de produção da Vercel exige as integrações: o build local e o preview
    // também rodam com NODE_ENV=production e podem ficar sem elas.
    if (env.VERCEL_ENV === 'production') {
      const reason = 'obrigatória no deploy de produção'
      required('MERCADOPAGO_ACCESS_TOKEN', reason)
      required('MERCADOPAGO_WEBHOOK_SECRET', reason)
      required('MELHORENVIO_TOKEN', reason)
      required('RESEND_API_KEY', reason)
      required('EMAIL_FROM', reason)
      required('CRON_SECRET', reason)
    }
```

Run: `npm test -- src/server/env.test.ts` → Expected: PASS.

- [ ] **Step 3: Documentar e alimentar CI, testes e doctor**

Acrescentar ao fim de `.env.example`:

```bash

# Link de acesso aos pedidos (obrigatório; 32+ caracteres aleatórios). Trocar invalida os links já enviados.
# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ORDER_TOKEN_SECRET=

# ── Integrações (opcionais em desenvolvimento e preview; obrigatórias no deploy de produção) ──
# Mercado Pago: fora da produção, use as credenciais de TESTE.
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
# Melhor Envio: sandbox ou production (o token de cada ambiente é diferente).
MELHORENVIO_ENV=sandbox
MELHORENVIO_TOKEN=
# Resend: sem chave, os e-mails só aparecem no log.
RESEND_API_KEY=
EMAIL_FROM=
# Vercel Cron (expiração de pedidos). A Vercel envia "Authorization: Bearer <CRON_SECRET>".
CRON_SECRET=
```

Em `.github/workflows/ci.yml`, no bloco `env:` do job, depois de `UPSTASH_REDIS_REST_TOKEN: ci`:

```yaml
      ORDER_TOKEN_SECRET: ci-0123456789abcdef0123456789abcdef
```

Em `tests/setup-integration.ts`, depois de `METADATA_SERVER_DETECTION`:

```ts
process.env.ORDER_TOKEN_SECRET ??= 'integration-order-token-secret-32chars!'
// publicEnv() monta as URLs de pedido e de webhook.
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000'
process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??= 'demo-streetstars.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??= 'test'
```

Em `scripts/doctor.sh`, trocar:

```bash
    elif [[ "$key" == UPSTASH_* ]]; then
```

por:

```bash
    elif [[ "$key" =~ ^(UPSTASH_|MERCADOPAGO_|MELHORENVIO_|RESEND_|EMAIL_FROM|CRON_SECRET) ]]; then
```

- [ ] **Step 4: Preencher o `.env.local` local (não versionado)**

```bash
grep -q '^ORDER_TOKEN_SECRET=' .env.local || node -e "
const r = () => require('crypto').randomBytes(32).toString('hex')
console.log('ORDER_TOKEN_SECRET=' + r())
console.log('CRON_SECRET=' + r())
console.log('MELHORENVIO_ENV=sandbox')
" >> .env.local
grep -oE '^[A-Z_]+' .env.local
```

Expected: a lista inclui `ORDER_TOKEN_SECRET`, `CRON_SECRET` e `MELHORENVIO_ENV`. Os tokens de Mercado Pago, Melhor Envio e Resend **não** são preenchidos aqui: o usuário coloca as credenciais de teste quando for testar manualmente.

- [ ] **Step 5: Verificar e commitar**

```bash
npm test && npm run typecheck && npm run lint
git add src/server/env.ts src/server/env.test.ts .env.example .github/workflows/ci.yml tests/setup-integration.ts scripts/doctor.sh
git commit -m "feat(env): add checkout, payment, email and cron variables"
```

---

### Task 2: Status do pedido e link de acesso

**Files:**
- Create: `src/lib/order-status.ts`, `src/server/domain/order-status.ts`, `src/server/domain/order-status.test.ts`, `src/server/domain/order-token.ts`, `src/server/domain/order-token.test.ts`

**Interfaces:**
- Produces:
  - `ORDER_STATUSES` (tupla), `type OrderStatus`, `ORDER_STATUS_LABELS: Record<OrderStatus, string>`, `isPaidStatus(status: OrderStatus): boolean` (em `@/lib/order-status`)
  - `canTransition(from: OrderStatus, to: OrderStatus): boolean` (em `@/server/domain/order-status`)
  - `createOrderToken(orderId: string, secret: string): string`, `readOrderToken(token: string, secret: string): string | null` (em `@/server/domain/order-token`)

- [ ] **Step 1: Escrever os testes**

`src/server/domain/order-status.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isPaidStatus, ORDER_STATUSES, type OrderStatus } from '@/lib/order-status'
import { canTransition } from './order-status'

const ALLOWED: [OrderStatus, OrderStatus][] = [
  ['pending_payment', 'paid'],
  ['pending_payment', 'expired'],
  ['pending_payment', 'cancelled'],
  ['expired', 'paid'],
  ['paid', 'in_production'],
  ['paid', 'cancelled'],
  ['paid', 'refunded'],
  ['in_production', 'shipped'],
  ['in_production', 'refunded'],
  ['shipped', 'delivered'],
  ['shipped', 'refunded'],
  ['delivered', 'refunded'],
]

describe('canTransition', () => {
  it('aceita só as transições da tabela da spec', () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const expected = ALLOWED.some(([f, t]) => f === from && t === to)
        expect(canTransition(from, to), `${from} → ${to}`).toBe(expected)
      }
    }
  })

  it('cancelado e estornado são finais', () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition('cancelled', to)).toBe(false)
      expect(canTransition('refunded', to)).toBe(false)
    }
  })
})

describe('isPaidStatus', () => {
  it('pago e posteriores contam como pagos', () => {
    expect(ORDER_STATUSES.filter(isPaidStatus)).toEqual([
      'paid',
      'in_production',
      'shipped',
      'delivered',
    ])
  })
})
```

`src/server/domain/order-token.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createOrderToken, readOrderToken } from './order-token'

const SECRET = 's'.repeat(32)

describe('link de acesso do pedido', () => {
  it('ida e volta devolve o id do pedido', () => {
    const token = createOrderToken('Ab12Cd34', SECRET)
    expect(token).toMatch(/^Ab12Cd34\.[A-Za-z0-9_-]{43}$/)
    expect(readOrderToken(token, SECRET)).toBe('Ab12Cd34')
  })

  it('é sempre o mesmo para o mesmo pedido (o webhook recalcula para o e-mail)', () => {
    expect(createOrderToken('o1', SECRET)).toBe(createOrderToken('o1', SECRET))
  })

  it('recusa assinatura de outro segredo', () => {
    expect(readOrderToken(createOrderToken('o1', 'o'.repeat(32)), SECRET)).toBeNull()
  })

  it('recusa trocar o id mantendo a assinatura', () => {
    const [, mac] = createOrderToken('o1', SECRET).split('.')
    expect(readOrderToken(`o2.${mac}`, SECRET)).toBeNull()
  })

  it.each(['', 'o1', 'o1.', '.abc', 'o1.abc.def', 'o/1.abc', 'o1.' + 'a'.repeat(43)])(
    'recusa %j',
    (token) => {
      expect(readOrderToken(token, SECRET)).toBeNull()
    },
  )
})
```

Run: `npm test -- src/server/domain` → Expected: FAIL (módulos não existem).

- [ ] **Step 2: Implementar**

`src/lib/order-status.ts`:

```ts
export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'in_production',
  'shipped',
  'delivered',
  'expired',
  'cancelled',
  'refunded',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  in_production: 'Em produção',
  shipped: 'Enviado',
  delivered: 'Entregue',
  expired: 'Prazo de pagamento encerrado',
  cancelled: 'Cancelado',
  refunded: 'Estornado',
}

const PAID: readonly OrderStatus[] = ['paid', 'in_production', 'shipped', 'delivered']

export function isPaidStatus(status: OrderStatus): boolean {
  return PAID.includes(status)
}
```

`src/server/domain/order-status.ts`:

```ts
import 'server-only'
import type { OrderStatus } from '@/lib/order-status'

// Máquina de status da spec (seção 3). Status nunca regridem.
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ['paid', 'expired', 'cancelled'],
  expired: ['paid'],
  paid: ['in_production', 'cancelled', 'refunded'],
  in_production: ['shipped', 'refunded'],
  shipped: ['delivered', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to)
}
```

`src/server/domain/order-token.ts`:

```ts
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

// O link é "<orderId>.<hmac>": dá para recalcular a qualquer momento (o webhook monta o
// link do e-mail), sem guardar segredo por pedido. Trocar o segredo invalida todos os links.
const ORDER_ID = /^[A-Za-z0-9]{1,64}$/

function sign(orderId: string, secret: string): string {
  return createHmac('sha256', secret).update(orderId).digest('base64url')
}

export function createOrderToken(orderId: string, secret: string): string {
  return `${orderId}.${sign(orderId, secret)}`
}

export function readOrderToken(token: string, secret: string): string | null {
  const parts = token.split('.')
  const [orderId, mac] = parts
  if (parts.length !== 2 || !orderId || !mac || !ORDER_ID.test(orderId)) return null
  const expected = Buffer.from(sign(orderId, secret))
  const given = Buffer.from(mac)
  return given.length === expected.length && timingSafeEqual(given, expected) ? orderId : null
}
```

Run: `npm test -- src/server/domain` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/order-status.ts src/server/domain/order-status.ts src/server/domain/order-status.test.ts src/server/domain/order-token.ts src/server/domain/order-token.test.ts
git commit -m "feat(orders): add order status machine and signed access token"
```

---

### Task 3: Regras de dinheiro — totais e cupons

**Files:**
- Create: `src/server/domain/pricing.ts`, `src/server/domain/pricing.test.ts`, `src/server/domain/coupons.ts`, `src/server/domain/coupons.test.ts`

**Interfaces:**
- Consumes: `isCents`, `formatBRL` (`@/lib/money`), `fail`, `ok`, `Result` (`@/lib/result`).
- Produces:
  - `type OrderTotals = { subtotalCents: number; discountCents: number; shippingCents: number; totalCents: number }`
  - `computeTotals(input: { subtotalCents: number; discountCents: number; shippingCents: number }): OrderTotals`
  - `type CouponType = 'percent' | 'fixed'`
  - `type CouponRule = { code: string; type: CouponType; value: number; minSubtotalCents: number | null; startsAt: Date | null; endsAt: Date | null; maxUses: number | null; usedCount: number; active: boolean }`
  - `type AppliedCoupon = { code: string; type: CouponType; value: number; discountCents: number }`
  - `normalizeCouponCode(input: string): string`, `isCouponCode(code: string): boolean`
  - `applyCoupon(coupon: CouponRule | null, subtotalCents: number, now: Date): Result<AppliedCoupon>` — códigos de falha: `coupon_invalid`, `coupon_not_started`, `coupon_expired`, `coupon_exhausted`, `coupon_min_subtotal`

- [ ] **Step 1: Escrever os testes**

`src/server/domain/pricing.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeTotals } from './pricing'

describe('computeTotals', () => {
  it('subtotal − desconto + frete', () => {
    expect(computeTotals({ subtotalCents: 29980, discountCents: 2998, shippingCents: 2500 })).toEqual(
      { subtotalCents: 29980, discountCents: 2998, shippingCents: 2500, totalCents: 29482 },
    )
  })

  it('desconto nunca passa do subtotal (o total fica igual ao frete)', () => {
    expect(computeTotals({ subtotalCents: 5000, discountCents: 9000, shippingCents: 2500 })).toEqual(
      { subtotalCents: 5000, discountCents: 5000, shippingCents: 2500, totalCents: 2500 },
    )
  })

  it.each([
    { subtotalCents: -1, discountCents: 0, shippingCents: 0 },
    { subtotalCents: 100, discountCents: 0.5, shippingCents: 0 },
    { subtotalCents: 100, discountCents: 0, shippingCents: Number.NaN },
  ])('recusa valor que não é centavo inteiro: %j', (input) => {
    expect(() => computeTotals(input)).toThrow(RangeError)
  })
})
```

`src/server/domain/coupons.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { applyCoupon, isCouponCode, normalizeCouponCode, type CouponRule } from './coupons'

const NOW = new Date('2026-10-04T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

const base: CouponRule = {
  code: 'BEMVINDO',
  type: 'percent',
  value: 10,
  minSubtotalCents: null,
  startsAt: null,
  endsAt: null,
  maxUses: null,
  usedCount: 0,
  active: true,
}

describe('applyCoupon', () => {
  it('percentual arredonda para baixo', () => {
    expect(applyCoupon(base, 14995, NOW)).toEqual({
      ok: true,
      data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 1499 },
    })
  })

  it('100% zera o subtotal', () => {
    const result = applyCoupon({ ...base, value: 100 }, 29980, NOW)
    expect(result).toMatchObject({ ok: true, data: { discountCents: 29980 } })
  })

  it('valor fixo é limitado ao subtotal', () => {
    const result = applyCoupon({ ...base, type: 'fixed', value: 50000 }, 29980, NOW)
    expect(result).toMatchObject({ ok: true, data: { discountCents: 29980 } })
  })

  it('vale dentro da janela, inclusive no último instante', () => {
    const result = applyCoupon(
      { ...base, startsAt: new Date(NOW.getTime() - DAY), endsAt: NOW },
      10000,
      NOW,
    )
    expect(result.ok).toBe(true)
  })

  it.each([
    ['inexistente', null, 'coupon_invalid'],
    ['inativo', { ...base, active: false }, 'coupon_invalid'],
    ['antes do início', { ...base, startsAt: new Date(NOW.getTime() + DAY) }, 'coupon_not_started'],
    ['expirado', { ...base, endsAt: new Date(NOW.getTime() - 1) }, 'coupon_expired'],
    ['esgotado', { ...base, maxUses: 3, usedCount: 3 }, 'coupon_exhausted'],
    ['abaixo do mínimo', { ...base, minSubtotalCents: 20000 }, 'coupon_min_subtotal'],
  ] as const)('recusa cupom %s', (_, coupon, code) => {
    expect(applyCoupon(coupon, 19990, NOW)).toMatchObject({ ok: false, code })
  })

  it('mensagem do mínimo mostra o valor em reais', () => {
    const result = applyCoupon({ ...base, minSubtotalCents: 20000 }, 19990, NOW)
    expect(result.ok ? '' : result.message).toMatch(/R\$\s200,00/)
  })
})

describe('código do cupom', () => {
  it('normaliza espaços e caixa', () => {
    expect(normalizeCouponCode('  bemVindo ')).toBe('BEMVINDO')
  })

  it.each([
    ['BEMVINDO', true],
    ['DROP_2026-X', true],
    ['', false],
    ['COM ESPAÇO', false],
    ['A/B', false],
    ['X'.repeat(33), false],
  ])('%j válido? %s', (code, expected) => {
    expect(isCouponCode(code)).toBe(expected)
  })
})
```

Run: `npm test -- src/server/domain` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/server/domain/pricing.ts`:

```ts
import 'server-only'
import { isCents } from '@/lib/money'

export type OrderTotals = {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
}

export function computeTotals(input: {
  subtotalCents: number
  discountCents: number
  shippingCents: number
}): OrderTotals {
  for (const [name, value] of Object.entries(input)) {
    if (!isCents(value)) throw new RangeError(`${name} inválido: ${value}`)
  }
  const discountCents = Math.min(input.discountCents, input.subtotalCents)
  return {
    subtotalCents: input.subtotalCents,
    discountCents,
    shippingCents: input.shippingCents,
    totalCents: input.subtotalCents - discountCents + input.shippingCents,
  }
}
```

`src/server/domain/coupons.ts`:

```ts
import 'server-only'
import { formatBRL } from '@/lib/money'
import { fail, ok, type Result } from '@/lib/result'

export type CouponType = 'percent' | 'fixed'

export type CouponRule = {
  code: string
  type: CouponType
  /** Percentual (1–100) ou centavos, conforme `type`. */
  value: number
  minSubtotalCents: number | null
  startsAt: Date | null
  endsAt: Date | null
  maxUses: number | null
  usedCount: number
  active: boolean
}

export type AppliedCoupon = { code: string; type: CouponType; value: number; discountCents: number }

// O código é o id do documento em coupons/: sem '/', espaços ou caracteres estranhos.
const COUPON_CODE = /^[A-Z0-9_-]{1,32}$/

export function normalizeCouponCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isCouponCode(code: string): boolean {
  return COUPON_CODE.test(code)
}

export function applyCoupon(
  coupon: CouponRule | null,
  subtotalCents: number,
  now: Date,
): Result<AppliedCoupon> {
  if (!coupon || !coupon.active) return fail('coupon_invalid', 'Cupom inválido.')
  if (coupon.startsAt && now < coupon.startsAt) {
    return fail('coupon_not_started', 'Este cupom ainda não está valendo.')
  }
  if (coupon.endsAt && now > coupon.endsAt) return fail('coupon_expired', 'Este cupom expirou.')
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return fail('coupon_exhausted', 'Este cupom esgotou.')
  }
  if (coupon.minSubtotalCents !== null && subtotalCents < coupon.minSubtotalCents) {
    return fail(
      'coupon_min_subtotal',
      `Este cupom vale para compras a partir de ${formatBRL(coupon.minSubtotalCents)}.`,
    )
  }

  const discountCents =
    coupon.type === 'percent'
      ? Math.floor((subtotalCents * coupon.value) / 100)
      : Math.min(coupon.value, subtotalCents)
  return ok({ code: coupon.code, type: coupon.type, value: coupon.value, discountCents })
}
```

Run: `npm test -- src/server/domain` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/server/domain/pricing.ts src/server/domain/pricing.test.ts src/server/domain/coupons.ts src/server/domain/coupons.test.ts
git commit -m "feat(checkout): add order totals and coupon rules"
```

---

### Task 4: Repositórios de pedidos e cupons

**Files:**
- Create: `src/server/db/orders.ts`, `src/server/db/coupons.ts`, `tests/integration/fixtures.ts`, `tests/integration/orders.test.ts`
- Modify: `firestore.indexes.json`

**Interfaces:**
- Consumes: `ORDER_STATUSES` (Task 2), `CouponRule`, `normalizeCouponCode`, `isCouponCode` (Task 3), `zodConverter`, `parseDoc`, `db`.
- Produces:
  - `orderSchema`, `type OrderDoc`, `type Order = OrderDoc & { id: string }`, `type OrderItem`, `type ShippingAddress`, `type StatusEntry`
  - `ordersCollection()` (coleção com conversor zod), `getOrder(id: string): Promise<Order | null>`, `idempotencyQuery(key: string)`, `findOrderByIdempotencyKey(key: string): Promise<Order | null>`, `nextOrderNumber(tx: Transaction): Promise<string>` (`'SS-1001'`, `'SS-1002'`…; **última leitura da transação**)
  - `couponSchema`, `getCouponRule(rawCode: string): Promise<CouponRule | null>`
  - Fixtures de teste: `NOW`, `productDoc(overrides)`, `orderDoc(overrides)`

- [ ] **Step 1: Fixtures e teste de integração**

`tests/integration/fixtures.ts`:

```ts
import type { ProductDoc } from '@/lib/catalog-schemas'
import type { OrderDoc } from '@/server/db/orders'

export const NOW = new Date('2026-10-04T12:00:00.000Z')

export function productDoc(overrides: Partial<ProductDoc> = {}): ProductDoc {
  return {
    slug: 'camiseta',
    name: 'Camiseta',
    description: 'Algodão',
    category: 'SUPERIORES',
    priceCents: 14990,
    weightGrams: 250,
    productionDays: 10,
    sizes: ['P', 'M'],
    colors: [{ name: 'Preto', hex: '#000000', image: null }],
    images: [
      { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: 'Camiseta' },
    ],
    highlights: [],
    sizeGuide: null,
    collectionIds: [],
    status: 'active',
    featured: false,
    featuredOrder: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function orderDoc(overrides: Partial<OrderDoc> = {}): OrderDoc {
  return {
    number: 'SS-1001',
    idempotencyKey: '00000000-0000-4000-8000-000000000001',
    customer: {
      uid: null,
      email: 'ana@exemplo.com',
      name: 'Ana Souza',
      phone: '11987654321',
      cpf: '52998224725',
    },
    items: [
      {
        productId: 'p1',
        slug: 'camiseta',
        name: 'Camiseta',
        image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
        size: 'M',
        color: 'Preto',
        unitPriceCents: 14990,
        qty: 2,
        lineTotalCents: 29980,
      },
    ],
    shippingAddress: {
      cep: '20040002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    shipping: {
      serviceId: 1,
      name: 'PAC',
      company: 'Correios',
      priceCents: 2500,
      deliveryDays: 8,
      productionDays: 10,
    },
    coupon: null,
    totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
    status: 'pending_payment',
    statusHistory: [{ status: 'pending_payment', at: NOW, by: 'system' }],
    payment: {
      preferenceId: null,
      paymentId: null,
      status: null,
      method: null,
      paidAmountCents: null,
      paidAt: null,
    },
    tracking: null,
    notifications: { confirmationSentAt: null, shippedSentAt: null, adminAlertSentAt: null },
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: new Date(NOW.getTime() + 48 * 60 * 60 * 1000),
    ...overrides,
  }
}
```

`tests/integration/orders.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { getCouponRule } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import {
  findOrderByIdempotencyKey,
  getOrder,
  nextOrderNumber,
  ordersCollection,
} from '@/server/db/orders'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

describe('orders repository', () => {
  it('numera em sequência a partir de SS-1001', async () => {
    const numbers: string[] = []
    for (let i = 0; i < 3; i++) numbers.push(await db().runTransaction((tx) => nextOrderNumber(tx)))
    expect(numbers).toEqual(['SS-1001', 'SS-1002', 'SS-1003'])
  })

  it('numeração concorrente não repete número', async () => {
    const numbers = await Promise.all(
      Array.from({ length: 5 }, () => db().runTransaction((tx) => nextOrderNumber(tx))),
    )
    expect(new Set(numbers).size).toBe(5)
  })

  it('grava e lê um pedido validado (datas voltam como Date)', async () => {
    await ordersCollection().doc('o1').set(orderDoc())
    expect(await getOrder('o1')).toEqual({ id: 'o1', ...orderDoc() })
    expect(await getOrder('nao-existe')).toBeNull()
  })

  it('acha o pedido pela chave de idempotência', async () => {
    await ordersCollection().doc('o1').set(orderDoc({ idempotencyKey: 'k-1' }))
    expect((await findOrderByIdempotencyKey('k-1'))?.id).toBe('o1')
    expect(await findOrderByIdempotencyKey('k-2')).toBeNull()
  })
})

describe('coupons repository', () => {
  it('lê o cupom pelo código normalizado', async () => {
    await db().doc('coupons/BEMVINDO').set({
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: NOW,
      maxUses: 100,
      usedCount: 2,
      active: true,
    })
    expect(await getCouponRule(' bemvindo ')).toEqual({
      code: 'BEMVINDO',
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: NOW,
      maxUses: 100,
      usedCount: 2,
      active: true,
    })
  })

  it('código inválido, inexistente ou documento quebrado → null', async () => {
    await db().doc('coupons/QUEBRADO').set({ type: 'percent', value: 500 })
    expect(await getCouponRule('a/b')).toBeNull()
    expect(await getCouponRule('NADA')).toBeNull()
    expect(await getCouponRule('QUEBRADO')).toBeNull()
  })
})
```

Run: `make test-emulator` → Expected: FAIL (módulos não existem).

- [ ] **Step 2: Implementar os repositórios**

`src/server/db/orders.ts`:

```ts
import 'server-only'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/order-status'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

const cents = z.number().int().min(0)

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string(),
  size: z.string().min(1),
  color: z.string().nullable(),
  unitPriceCents: cents,
  qty: z.number().int().min(1).max(10),
  lineTotalCents: cents,
})

export const shippingAddressSchema = z.object({
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().regex(/^[A-Z]{2}$/),
})

export const statusEntrySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  at: z.date(),
  /** 'system', 'webhook' ou o uid do admin. */
  by: z.string().min(1),
  note: z.string().optional(),
  /** Pagamento do Mercado Pago que gerou a entrada (webhook). */
  paymentId: z.string().optional(),
})

export const orderSchema = z.object({
  number: z.string().regex(/^SS-\d+$/),
  idempotencyKey: z.string().min(1),
  customer: z.object({
    uid: z.string().nullable(),
    email: z.email(),
    name: z.string().min(1),
    phone: z.string(),
    cpf: z.string(),
  }),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: shippingAddressSchema,
  shipping: z.object({
    serviceId: z.number().int(),
    name: z.string(),
    company: z.string(),
    priceCents: cents,
    deliveryDays: z.number().int().min(0),
    productionDays: z.number().int().min(0),
  }),
  coupon: z
    .object({
      code: z.string(),
      type: z.enum(['percent', 'fixed']),
      value: z.number().int(),
      discountCents: cents,
    })
    .nullable(),
  totals: z.object({
    subtotalCents: cents,
    discountCents: cents,
    shippingCents: cents,
    totalCents: cents,
  }),
  status: z.enum(ORDER_STATUSES),
  statusHistory: z.array(statusEntrySchema),
  payment: z.object({
    preferenceId: z.string().nullable(),
    paymentId: z.string().nullable(),
    status: z.string().nullable(),
    method: z.string().nullable(),
    paidAmountCents: cents.nullable(),
    paidAt: z.date().nullable(),
  }),
  tracking: z
    .object({ carrier: z.string(), code: z.string(), url: z.string().nullable() })
    .nullable(),
  notifications: z.object({
    confirmationSentAt: z.date().nullable(),
    shippedSentAt: z.date().nullable(),
    /** E-mail de "novo pedido pago" para a loja. */
    adminAlertSentAt: z.date().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date(),
})

export type OrderDoc = z.infer<typeof orderSchema>
export type Order = OrderDoc & { id: string }
export type OrderItem = z.infer<typeof orderItemSchema>
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type StatusEntry = z.infer<typeof statusEntrySchema>

const FIRST_ORDER_NUMBER = 1001

export const ordersCollection = () =>
  db().collection('orders').withConverter(zodConverter(orderSchema))

export async function getOrder(id: string): Promise<Order | null> {
  const snapshot = await ordersCollection().doc(id).get()
  const data = snapshot.data()
  return data ? { id: snapshot.id, ...data } : null
}

export function idempotencyQuery(key: string) {
  return ordersCollection().where('idempotencyKey', '==', key).limit(1)
}

export async function findOrderByIdempotencyKey(key: string): Promise<Order | null> {
  const doc = (await idempotencyQuery(key).get()).docs[0]
  return doc ? { id: doc.id, ...doc.data() } : null
}

/** Lê e incrementa counters/orders. Deve ser a última leitura da transação. */
export async function nextOrderNumber(tx: Transaction): Promise<string> {
  const ref = db().doc('counters/orders')
  const snapshot = await tx.get(ref)
  const last = snapshot.exists ? Number(snapshot.get('last')) : FIRST_ORDER_NUMBER - 1
  tx.set(ref, { last: last + 1 })
  return `SS-${last + 1}`
}
```

`src/server/db/coupons.ts`:

```ts
import 'server-only'
import { z } from 'zod'
import { isCouponCode, normalizeCouponCode, type CouponRule } from '@/server/domain/coupons'
import { parseDoc } from './convert'
import { db } from './firebase-admin'

export const couponSchema = z
  .object({
    type: z.enum(['percent', 'fixed']),
    value: z.number().int().positive(),
    minSubtotalCents: z.number().int().min(0).nullable(),
    startsAt: z.date().nullable(),
    endsAt: z.date().nullable(),
    maxUses: z.number().int().positive().nullable(),
    usedCount: z.number().int().min(0),
    active: z.boolean(),
  })
  .refine((coupon) => coupon.type === 'fixed' || coupon.value <= 100, {
    message: 'percentual acima de 100',
  })

export async function getCouponRule(rawCode: string): Promise<CouponRule | null> {
  const code = normalizeCouponCode(rawCode)
  if (!isCouponCode(code)) return null
  const snapshot = await db().collection('coupons').doc(code).get()
  if (!snapshot.exists) return null
  const data = parseDoc(couponSchema, snapshot.ref.path, snapshot.data())
  return data ? { code, ...data } : null
}
```

`firestore.indexes.json` (consulta do cron de expiração):

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Run: `make test-emulator` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint
git add src/server/db/orders.ts src/server/db/coupons.ts tests/integration/fixtures.ts tests/integration/orders.test.ts firestore.indexes.json
git commit -m "feat(orders): add order and coupon repositories with sequential numbering"
```

---

### Task 5: Frete — Melhor Envio, ViaCEP e pacote do carrinho

**Files:**
- Create: `src/server/domain/shipping-estimate.ts`, `src/server/domain/shipping-estimate.test.ts`, `src/server/integrations/melhorenvio.ts`, `src/server/integrations/melhorenvio.test.ts`, `src/server/integrations/viacep.ts`, `src/server/integrations/viacep.test.ts`

**Interfaces:**
- Consumes: `parseReaisToCents` (`@/lib/money`), `serverEnv`.
- Produces:
  - `cartPackage(lines: { productId: string; qty: number }[], products: { id: string; weightGrams: number; productionDays: number }[]): { weightGrams: number; productionDays: number }`
  - `type ShippingQuote = { serviceId: number; name: string; company: string; priceCents: number; deliveryDays: number }`
  - `parseQuotes(raw: unknown): ShippingQuote[]` (ordenado por preço), `quoteShipping(input: { fromCep: string; toCep: string; weightGrams: number; package: { heightCm: number; widthCm: number; lengthCm: number } }): Promise<ShippingQuote[]>` (lança `Error` em qualquer falha)
  - `type CepAddress = { street: string; neighborhood: string; city: string; state: string }`, `lookupCep(cep: string): Promise<CepAddress | null>` (`null` = CEP não existe; lança em falha de rede)

- [ ] **Step 1: Escrever os testes**

`src/server/domain/shipping-estimate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cartPackage } from './shipping-estimate'

const products = [
  { id: 'tee', weightGrams: 250, productionDays: 10 },
  { id: 'hoodie', weightGrams: 700, productionDays: 15 },
]

describe('cartPackage', () => {
  it('soma o peso por quantidade e usa o maior prazo de produção', () => {
    expect(
      cartPackage(
        [
          { productId: 'tee', qty: 2 },
          { productId: 'hoodie', qty: 1 },
        ],
        products,
      ),
    ).toEqual({ weightGrams: 1200, productionDays: 15 })
  })

  it('falha se faltar o produto (não cota frete com peso errado)', () => {
    expect(() => cartPackage([{ productId: 'sumiu', qty: 1 }], products)).toThrow('sumiu')
  })
})
```

`src/server/integrations/melhorenvio.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { parseQuotes, quoteShipping } from './melhorenvio'

const fetchMock = vi.fn()
const input = {
  fromCep: '01001000',
  toCep: '20040002',
  weightGrams: 950,
  package: { heightCm: 5, widthCm: 30, lengthCm: 30 },
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'sandbox' }
})
afterEach(() => vi.unstubAllGlobals())

describe('parseQuotes', () => {
  it('usa preço e prazo da conta, ignora serviços com erro e ordena pelo preço', () => {
    expect(
      parseQuotes([
        {
          id: 2,
          name: 'SEDEX',
          price: '40.10',
          custom_price: '38.50',
          delivery_time: 2,
          custom_delivery_time: 3,
          company: { name: 'Correios' },
        },
        { id: 1, name: 'PAC', price: '25.00', delivery_time: 7, company: { name: 'Correios' } },
        { id: 3, name: 'Mini', error: 'Serviço indisponível para o trecho.' },
      ]),
    ).toEqual([
      { serviceId: 1, name: 'PAC', company: 'Correios', priceCents: 2500, deliveryDays: 7 },
      { serviceId: 2, name: 'SEDEX', company: 'Correios', priceCents: 3850, deliveryDays: 3 },
    ])
  })

  it('recusa resposta fora do formato', () => {
    expect(() => parseQuotes({ message: 'Unauthenticated.' })).toThrow()
  })
})

describe('quoteShipping', () => {
  it('chama o sandbox com peso em kg e só PAC e SEDEX', async () => {
    fetchMock.mockResolvedValue(
      json([{ id: 1, name: 'PAC', price: '25.00', delivery_time: 7, company: { name: 'Correios' } }]),
    )
    expect(await quoteShipping(input)).toHaveLength(1)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' })
    expect(JSON.parse(init.body)).toEqual({
      from: { postal_code: '01001000' },
      to: { postal_code: '20040002' },
      package: { height: 5, width: 30, length: 30, weight: 0.95 },
      options: { receipt: false, own_hand: false },
      services: '1,2',
    })
  })

  it('usa a URL de produção quando configurado', async () => {
    env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'production' }
    fetchMock.mockResolvedValue(json([]))
    await quoteShipping(input)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
    )
  })

  it('falha sem token, com erro HTTP ou de rede', async () => {
    env.value = { MELHORENVIO_ENV: 'sandbox' }
    await expect(quoteShipping(input)).rejects.toThrow('MELHORENVIO_TOKEN')

    env.value = { MELHORENVIO_TOKEN: 'tok', MELHORENVIO_ENV: 'sandbox' }
    fetchMock.mockResolvedValueOnce(json({ message: 'Unauthenticated.' }, 401))
    await expect(quoteShipping(input)).rejects.toThrow('401')

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(quoteShipping(input)).rejects.toThrow()
  })
})
```

`src/server/integrations/viacep.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lookupCep } from './viacep'

const fetchMock = vi.fn()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('lookupCep', () => {
  it('traduz a resposta do ViaCEP', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          cep: '01001-000',
          logradouro: 'Praça da Sé',
          bairro: 'Sé',
          localidade: 'São Paulo',
          uf: 'SP',
        }),
      ),
    )
    expect(await lookupCep('01001000')).toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://viacep.com.br/ws/01001000/json/')
  })

  it('CEP inexistente → null', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ erro: 'true' })))
    expect(await lookupCep('99999999')).toBeNull()
  })

  it('erro do serviço lança', async () => {
    fetchMock.mockResolvedValue(new Response('fora', { status: 503 }))
    await expect(lookupCep('01001000')).rejects.toThrow('503')
  })
})
```

Run: `npm test -- src/server` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/server/domain/shipping-estimate.ts`:

```ts
import 'server-only'

type ShippingProduct = { id: string; weightGrams: number; productionDays: number }

/** Um pacote só (medidas fixas de settings/store.package), com o peso somado do carrinho. */
export function cartPackage(
  lines: { productId: string; qty: number }[],
  products: ShippingProduct[],
): { weightGrams: number; productionDays: number } {
  const byId = new Map(products.map((product) => [product.id, product]))
  let weightGrams = 0
  let productionDays = 0
  for (const line of lines) {
    const product = byId.get(line.productId)
    if (!product) throw new Error(`Produto sem dados de frete: ${line.productId}`)
    weightGrams += product.weightGrams * line.qty
    productionDays = Math.max(productionDays, product.productionDays)
  }
  return { weightGrams, productionDays }
}
```

`src/server/integrations/melhorenvio.ts`:

```ts
import 'server-only'
import { z } from 'zod'
import { parseReaisToCents } from '@/lib/money'
import { serverEnv } from '@/server/env'

/** Correios PAC (1) e SEDEX (2): decisão da Fase 3. */
const SERVICES = '1,2'

const BASE_URL = {
  sandbox: 'https://sandbox.melhorenvio.com.br',
  production: 'https://melhorenvio.com.br',
} as const

export type ShippingQuote = {
  serviceId: number
  name: string
  company: string
  priceCents: number
  deliveryDays: number
}

const money = z.union([z.string(), z.number()]).transform(String)

const quotesSchema = z.array(
  z.object({
    id: z.number().int(),
    name: z.string(),
    error: z.string().optional(),
    price: money.optional(),
    custom_price: money.optional(),
    delivery_time: z.number().int().optional(),
    custom_delivery_time: z.number().int().optional(),
    company: z.object({ name: z.string() }).optional(),
  }),
)

export function parseQuotes(raw: unknown): ShippingQuote[] {
  const services = quotesSchema.parse(raw)
  return services
    .flatMap((service) => {
      if (service.error) return []
      // custom_* é o que a conta paga de fato (descontos e prazo extra configurados no painel).
      const priceCents = parseReaisToCents(service.custom_price ?? service.price ?? '')
      const deliveryDays = service.custom_delivery_time ?? service.delivery_time
      if (priceCents === null || deliveryDays === undefined) return []
      return [
        {
          serviceId: service.id,
          name: service.name,
          company: service.company?.name ?? '',
          priceCents,
          deliveryDays,
        },
      ]
    })
    .sort((a, b) => a.priceCents - b.priceCents)
}

export async function quoteShipping(input: {
  fromCep: string
  toCep: string
  weightGrams: number
  package: { heightCm: number; widthCm: number; lengthCm: number }
}): Promise<ShippingQuote[]> {
  const env = serverEnv()
  if (!env.MELHORENVIO_TOKEN) throw new Error('MELHORENVIO_TOKEN ausente')

  const response = await fetch(`${BASE_URL[env.MELHORENVIO_ENV]}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MELHORENVIO_TOKEN}`,
      // O Melhor Envio exige User-Agent com contato.
      'User-Agent': 'StreetStars (streetstars.company@gmail.com)',
    },
    body: JSON.stringify({
      from: { postal_code: input.fromCep },
      to: { postal_code: input.toCep },
      package: {
        height: input.package.heightCm,
        width: input.package.widthCm,
        length: input.package.lengthCm,
        weight: input.weightGrams / 1000,
      },
      options: { receipt: false, own_hand: false },
      services: SERVICES,
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error(`Melhor Envio respondeu ${response.status}`)
  return parseQuotes(await response.json())
}
```

`src/server/integrations/viacep.ts`:

```ts
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
  return { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }
}
```

Run: `npm test -- src/server` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint
git add src/server/domain/shipping-estimate.ts src/server/domain/shipping-estimate.test.ts src/server/integrations/melhorenvio.ts src/server/integrations/melhorenvio.test.ts src/server/integrations/viacep.ts src/server/integrations/viacep.test.ts
git commit -m "feat(shipping): add melhor envio quotes, viacep lookup and cart package"
```

---

### Task 6: Mercado Pago — preferência, pagamento e assinatura do webhook

**Files:**
- Create: `src/server/integrations/mercadopago.ts`, `src/server/integrations/mercadopago.test.ts`, `src/server/integrations/mercadopago-signature.ts`, `src/server/integrations/mercadopago-signature.test.ts`

**Interfaces:**
- Consumes: `OrderDoc` (Task 4), `serverEnv`.
- Produces:
  - `MAX_INSTALLMENTS = 6`
  - `type PreferenceOrder = Pick<OrderDoc, 'number' | 'customer' | 'items' | 'totals' | 'expiresAt'> & { id: string }`
  - `buildPreferenceBody(order: PreferenceOrder, urls: { orderUrl: string; notificationUrl: string }): Record<string, unknown>`
  - `createPreference(body: Record<string, unknown>): Promise<{ preferenceId: string; initPoint: string }>`
  - `type MpPayment = { id: string; status: string; externalReference: string | null; amountCents: number; method: string | null; approvedAt: Date | null }`
  - `getPayment(id: string): Promise<MpPayment>`
  - `verifyMercadoPagoSignature(input: { signature: string | null; requestId: string | null; dataId: string | null; secret: string }): boolean`

- [ ] **Step 1: Escrever os testes**

`src/server/integrations/mercadopago-signature.test.ts`:

```ts
import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyMercadoPagoSignature } from './mercadopago-signature'

const secret = 'segredo'
const sign = (manifest: string, key = secret) =>
  createHmac('sha256', key).update(manifest).digest('hex')
const header = (manifest: string, key = secret) => `ts=1700000000,v1=${sign(manifest, key)}`
const MANIFEST = 'id:123456;request-id:req-1;ts:1700000000;'
const valid = { signature: header(MANIFEST), requestId: 'req-1', dataId: '123456', secret }

describe('verifyMercadoPagoSignature', () => {
  it('aceita a assinatura do Mercado Pago', () => {
    expect(verifyMercadoPagoSignature(valid)).toBe(true)
  })

  it('id alfanumérico entra em minúsculas no manifesto', () => {
    const signature = header('id:abc123;request-id:req-1;ts:1700000000;')
    expect(verifyMercadoPagoSignature({ ...valid, signature, dataId: 'ABC123' })).toBe(true)
  })

  it('sem request-id, a parte sai do manifesto', () => {
    const signature = header('id:123456;ts:1700000000;')
    expect(verifyMercadoPagoSignature({ ...valid, signature, requestId: null })).toBe(true)
  })

  it.each([
    ['segredo errado', { ...valid, secret: 'outro' }],
    ['id trocado', { ...valid, dataId: '999' }],
    ['request-id trocado', { ...valid, requestId: 'req-2' }],
    ['sem cabeçalho', { ...valid, signature: null }],
    ['sem ts', { ...valid, signature: `v1=${sign(MANIFEST)}` }],
    ['v1 com outro tamanho', { ...valid, signature: 'ts=1700000000,v1=abc' }],
  ])('recusa: %s', (_, input) => {
    expect(verifyMercadoPagoSignature(input)).toBe(false)
  })
})
```

`src/server/integrations/mercadopago.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { buildPreferenceBody, createPreference, getPayment, type PreferenceOrder } from './mercadopago'

const order: PreferenceOrder = {
  id: 'o1',
  number: 'SS-1001',
  customer: {
    uid: null,
    email: 'ana@exemplo.com',
    name: 'Ana Maria Souza',
    phone: '11987654321',
    cpf: '52998224725',
  },
  items: [
    {
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: '',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
    {
      productId: 'p2',
      slug: 'bone',
      name: 'Boné',
      image: '',
      size: 'UN',
      color: null,
      unitPriceCents: 12990,
      qty: 1,
      lineTotalCents: 12990,
    },
  ],
  totals: { subtotalCents: 42970, discountCents: 0, shippingCents: 2500, totalCents: 45470 },
  expiresAt: new Date('2026-10-06T12:00:00.000Z'),
}
const urls = {
  orderUrl: 'https://loja.test/pedido/o1.mac',
  notificationUrl: 'https://loja.test/api/webhooks/mercadopago?source_news=webhooks',
}

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  env.value = { MERCADOPAGO_ACCESS_TOKEN: 'TEST-123' }
})
afterEach(() => vi.unstubAllGlobals())

describe('buildPreferenceBody', () => {
  it('sem desconto: itens detalhados + frete, Pix e cartão em até 6x', () => {
    const body = buildPreferenceBody(order, urls)
    expect(body).toMatchObject({
      items: [
        { id: 'p1', title: 'Camiseta · M · Preto', quantity: 2, unit_price: 149.9, currency_id: 'BRL' },
        { id: 'p2', title: 'Boné · UN', quantity: 1, unit_price: 129.9, currency_id: 'BRL' },
      ],
      payer: {
        name: 'Ana',
        surname: 'Maria Souza',
        email: 'ana@exemplo.com',
        identification: { type: 'CPF', number: '52998224725' },
      },
      shipments: { cost: 25, mode: 'not_specified' },
      back_urls: { success: urls.orderUrl, failure: urls.orderUrl, pending: urls.orderUrl },
      auto_return: 'approved',
      external_reference: 'o1',
      notification_url: urls.notificationUrl,
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
        installments: 6,
      },
      expires: true,
      expiration_date_to: '2026-10-06T12:00:00.000Z',
    })
  })

  it('com desconto: um item só com o total (frete incluso), nunca valor zero', () => {
    const body = buildPreferenceBody(
      {
        ...order,
        totals: { subtotalCents: 42970, discountCents: 42970, shippingCents: 2500, totalCents: 2500 },
      },
      urls,
    )
    expect(body.items).toEqual([
      { id: 'SS-1001', title: 'Pedido SS-1001', quantity: 1, unit_price: 25, currency_id: 'BRL' },
    ])
    expect(body).not.toHaveProperty('shipments')
  })

  it('sem https (desenvolvimento) não pede retorno automático', () => {
    const body = buildPreferenceBody(order, { ...urls, orderUrl: 'http://localhost:3000/pedido/x' })
    expect(body).not.toHaveProperty('auto_return')
  })
})

describe('createPreference', () => {
  it('cria a preferência com o token e devolve o link', async () => {
    fetchMock.mockResolvedValue(json({ id: 'pref-1', init_point: 'https://mp.test/init?pref=1' }))
    expect(await createPreference({ a: 1 })).toEqual({
      preferenceId: 'pref-1',
      initPoint: 'https://mp.test/init?pref=1',
    })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.mercadopago.com/checkout/preferences')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer TEST-123' })
    expect(JSON.parse(init.body)).toEqual({ a: 1 })
  })

  it('falha sem token ou com erro HTTP', async () => {
    env.value = {}
    await expect(createPreference({})).rejects.toThrow('MERCADOPAGO_ACCESS_TOKEN')
    env.value = { MERCADOPAGO_ACCESS_TOKEN: 'TEST-123' }
    fetchMock.mockResolvedValue(json({ message: 'bad' }, 400))
    await expect(createPreference({})).rejects.toThrow('400')
  })
})

describe('getPayment', () => {
  it('traduz o pagamento para centavos e datas', async () => {
    fetchMock.mockResolvedValue(
      json({
        id: 9001,
        status: 'approved',
        external_reference: 'o1',
        transaction_amount: 324.8,
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
        date_approved: '2026-10-04T13:00:00.000-03:00',
      }),
    )
    expect(await getPayment('9001')).toEqual({
      id: '9001',
      status: 'approved',
      externalReference: 'o1',
      amountCents: 32480,
      method: 'pix',
      approvedAt: new Date('2026-10-04T16:00:00.000Z'),
    })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.mercadopago.com/v1/payments/9001')
  })

  it('recusa id que não é numérico sem chamar a API', async () => {
    await expect(getPayment('../x')).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
```

Run: `npm test -- src/server/integrations` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/server/integrations/mercadopago-signature.ts`:

```ts
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Assinatura dos webhooks do Mercado Pago:
 * x-signature "ts=...,v1=..." = HMAC-SHA256(secret, "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
 * Partes ausentes saem do manifesto; data.id alfanumérico entra em minúsculas.
 */
export function verifyMercadoPagoSignature(input: {
  signature: string | null
  requestId: string | null
  dataId: string | null
  secret: string
}): boolean {
  if (!input.signature) return false
  const parts = new Map(
    input.signature.split(',').map((part) => {
      const [key = '', ...value] = part.split('=')
      return [key.trim(), value.join('=').trim()] as const
    }),
  )
  const ts = parts.get('ts')
  const v1 = parts.get('v1')
  if (!ts || !v1) return false

  const id =
    input.dataId && /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId
  let manifest = ''
  if (id) manifest += `id:${id};`
  if (input.requestId) manifest += `request-id:${input.requestId};`
  manifest += `ts:${ts};`

  const expected = Buffer.from(createHmac('sha256', input.secret).update(manifest).digest('hex'))
  const given = Buffer.from(v1)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
```

`src/server/integrations/mercadopago.ts`:

```ts
import 'server-only'
import { z } from 'zod'
import type { OrderDoc } from '@/server/db/orders'
import { serverEnv } from '@/server/env'

const API = 'https://api.mercadopago.com'
export const MAX_INSTALLMENTS = 6

export type PreferenceOrder = Pick<
  OrderDoc,
  'number' | 'customer' | 'items' | 'totals' | 'expiresAt'
> & { id: string }

const reais = (cents: number) => cents / 100

export function buildPreferenceBody(
  order: PreferenceOrder,
  urls: { orderUrl: string; notificationUrl: string },
): Record<string, unknown> {
  // O Checkout Pro não aceita item negativo. Com desconto, um item só com o total garante que o
  // valor cobrado é exatamente totals.totalCents (o webhook confere) e nunca R$ 0.
  const itemized = order.totals.discountCents === 0
  const [firstName = '', ...lastNames] = order.customer.name.trim().split(/\s+/)

  return {
    items: itemized
      ? order.items.map((item) => ({
          id: item.productId,
          title: [item.name, item.size, item.color].filter(Boolean).join(' · '),
          quantity: item.qty,
          unit_price: reais(item.unitPriceCents),
          currency_id: 'BRL',
        }))
      : [
          {
            id: order.number,
            title: `Pedido ${order.number}`,
            quantity: 1,
            unit_price: reais(order.totals.totalCents),
            currency_id: 'BRL',
          },
        ],
    ...(itemized
      ? { shipments: { cost: reais(order.totals.shippingCents), mode: 'not_specified' } }
      : {}),
    payer: {
      name: firstName,
      surname: lastNames.join(' '),
      email: order.customer.email,
      identification: { type: 'CPF', number: order.customer.cpf },
    },
    back_urls: { success: urls.orderUrl, failure: urls.orderUrl, pending: urls.orderUrl },
    // O MP recusa auto_return com back_url sem https (localhost).
    ...(urls.orderUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
    external_reference: order.id,
    notification_url: urls.notificationUrl,
    statement_descriptor: 'STREETSTARS',
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
      installments: MAX_INSTALLMENTS,
    },
    expires: true,
    expiration_date_to: order.expiresAt.toISOString(),
  }
}

async function mercadoPago(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = serverEnv().MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente')
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Mercado Pago respondeu ${response.status} em ${path}`)
  return response.json()
}

const preferenceSchema = z.object({ id: z.string(), init_point: z.url() })

export async function createPreference(
  body: Record<string, unknown>,
): Promise<{ preferenceId: string; initPoint: string }> {
  const data = preferenceSchema.parse(
    await mercadoPago('/checkout/preferences', { method: 'POST', body: JSON.stringify(body) }),
  )
  return { preferenceId: data.id, initPoint: data.init_point }
}

export type MpPayment = {
  id: string
  status: string
  externalReference: string | null
  amountCents: number
  method: string | null
  approvedAt: Date | null
}

const paymentSchema = z.object({
  id: z.union([z.number(), z.string()]).transform(String),
  status: z.string(),
  external_reference: z.string().nullish(),
  transaction_amount: z.number(),
  payment_method_id: z.string().nullish(),
  payment_type_id: z.string().nullish(),
  date_approved: z.string().nullish(),
})

export async function getPayment(id: string): Promise<MpPayment> {
  if (!/^\d{1,20}$/.test(id)) throw new Error(`id de pagamento inválido: ${id}`)
  const data = paymentSchema.parse(await mercadoPago(`/v1/payments/${id}`))
  return {
    id: data.id,
    status: data.status,
    externalReference: data.external_reference ?? null,
    amountCents: Math.round(data.transaction_amount * 100),
    method: data.payment_method_id ?? data.payment_type_id ?? null,
    approvedAt: data.date_approved ? new Date(data.date_approved) : null,
  }
}
```

Run: `npm test -- src/server/integrations` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint
git add src/server/integrations/mercadopago.ts src/server/integrations/mercadopago.test.ts src/server/integrations/mercadopago-signature.ts src/server/integrations/mercadopago-signature.test.ts
git commit -m "feat(payment): add mercado pago preference, payment lookup and webhook signature"
```

---

### Task 7: E-mails transacionais

**Files:**
- Create: `src/emails/html.ts`, `src/emails/html.test.ts`, `src/emails/layout.ts`, `src/emails/order-confirmation.ts`, `src/emails/admin-new-order.ts`, `src/emails/admin-alert.ts`, `src/emails/emails.test.ts`, `src/server/integrations/resend.ts`, `src/server/integrations/resend.test.ts`

Decisão: templates em HTML com escape automático (tagged template `html`), sem react-email. O resultado é o mesmo (conteúdo do cliente sempre escapado) sem dependência nova e sem `react-dom/server`, que o App Router bloqueia no bundle do servidor. Registrar na spec (Task 14).

**Interfaces:**
- Consumes: `OrderDoc` (Task 4), `formatBRL`, `formatCep`, `formatCpf`, `formatPhone`, `serverEnv`.
- Produces:
  - `escapeHtml(value: string): string`, `class SafeHtml`, `` html`...` `` (tagged template → `SafeHtml`)
  - `type EmailOrder = Pick<OrderDoc, 'number' | 'customer' | 'items' | 'totals' | 'shipping' | 'shippingAddress' | 'coupon'>`
  - `orderConfirmationEmail(order: EmailOrder, orderUrl: string): { subject: string; html: string }`
  - `adminNewOrderEmail(order: EmailOrder): { subject: string; html: string }`
  - `adminAlertEmail(input: { orderNumber: string; message: string }): { subject: string; html: string }`
  - `sendEmail(message: { to: string; subject: string; html: string; replyTo?: string }): Promise<void>` (sem Resend configurado → só log; erro HTTP → lança)

- [ ] **Step 1: Escrever os testes**

`src/emails/html.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { escapeHtml, html } from './html'

describe('html', () => {
  it('escapa os valores interpolados', () => {
    expect(html`<p>${'<b>"Ana" & \'Bia\'</b>'}</p>`.value).toBe(
      '<p>&lt;b&gt;&quot;Ana&quot; &amp; &#39;Bia&#39;&lt;/b&gt;</p>',
    )
  })

  it('não escapa de novo o que já é html seguro, aceita listas e ignora vazios', () => {
    const items = ['a', '<b>'].map((item) => html`<li>${item}</li>`)
    expect(html`<ul>${items}</ul>${null}${undefined}${false}${42}`.value).toBe(
      '<ul><li>a</li><li>&lt;b&gt;</li></ul>42',
    )
  })

  it('escapeHtml', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
})
```

`src/emails/emails.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { adminAlertEmail } from './admin-alert'
import { adminNewOrderEmail } from './admin-new-order'
import type { EmailOrder } from './layout'
import { orderConfirmationEmail } from './order-confirmation'

const order: EmailOrder = {
  number: 'SS-1001',
  customer: {
    uid: null,
    email: 'ana@exemplo.com',
    name: 'Ana Souza',
    phone: '11987654321',
    cpf: '52998224725',
  },
  items: [
    {
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: '',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
  ],
  totals: { subtotalCents: 29980, discountCents: 2998, shippingCents: 2500, totalCents: 29482 },
  shipping: {
    serviceId: 1,
    name: 'PAC',
    company: 'Correios',
    priceCents: 2500,
    deliveryDays: 8,
    productionDays: 10,
  },
  shippingAddress: {
    cep: '20040002',
    street: 'Rua da Assembleia',
    number: '10',
    complement: 'Sala 2',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  coupon: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
}

describe('e-mail de confirmação', () => {
  it('tem número, prazo, link, itens, totais e endereço', () => {
    const email = orderConfirmationEmail(order, 'https://loja.test/pedido/o1.mac')
    expect(email.subject).toBe('Pedido SS-1001 confirmado')
    expect(email.html).toContain('Oi, Ana!')
    expect(email.html).toContain('até 18 dias úteis')
    expect(email.html).toContain('href="https://loja.test/pedido/o1.mac"')
    expect(email.html).toContain('Tam. M · Preto · Qtd. 2')
    expect(email.html).toMatch(/Cupom BEMVINDO/)
    expect(email.html).toMatch(/R\$\s294,82/)
    expect(email.html).toContain('CEP 20040-002')
  })

  it('escapa o que veio do cliente', () => {
    const email = orderConfirmationEmail(
      { ...order, customer: { ...order.customer, name: '<script>x</script> Souza' } },
      'https://loja.test/pedido/a.b?x=1&y=2',
    )
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).toContain('href="https://loja.test/pedido/a.b?x=1&amp;y=2"')
  })
})

describe('e-mails da loja', () => {
  it('novo pedido traz contato, CPF e frete para a etiqueta', () => {
    const email = adminNewOrderEmail(order)
    expect(email.subject).toMatch(/^Novo pedido pago SS-1001 · R\$\s294,82$/)
    expect(email.html).toContain('ana@exemplo.com')
    expect(email.html).toContain('(11) 98765-4321')
    expect(email.html).toContain('529.982.247-25')
    expect(email.html).toContain('PAC (Correios)')
  })

  it('alerta', () => {
    const email = adminAlertEmail({ orderNumber: 'SS-1001', message: 'Valor <divergente>' })
    expect(email.subject).toBe('Alerta no pedido SS-1001')
    expect(email.html).toContain('Valor &lt;divergente&gt;')
  })
})
```

`src/server/integrations/resend.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env = vi.hoisted(() => ({ value: {} as Record<string, string | undefined> }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { sendEmail } from './resend'

const fetchMock = vi.fn()
const message = { to: 'ana@exemplo.com', subject: 'Oi', html: '<p>oi</p>' }

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('sendEmail', () => {
  it('sem Resend configurado (desenvolvimento), só registra no log', async () => {
    env.value = { NODE_ENV: 'development' }
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    await sendEmail(message)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalled()
  })

  it('envia pela API do Resend', async () => {
    env.value = { RESEND_API_KEY: 're_1', EMAIL_FROM: 'Street Stars <pedidos@loja.test>' }
    fetchMock.mockResolvedValue(new Response('{"id":"e1"}'))
    await sendEmail({ ...message, replyTo: 'loja@loja.test' })
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_1' })
    expect(JSON.parse(init.body)).toEqual({
      from: 'Street Stars <pedidos@loja.test>',
      to: ['ana@exemplo.com'],
      subject: 'Oi',
      html: '<p>oi</p>',
      reply_to: 'loja@loja.test',
    })
  })

  it('erro do Resend lança (o webhook responde 500 e o MP reenvia)', async () => {
    env.value = { RESEND_API_KEY: 're_1', EMAIL_FROM: 'x@loja.test' }
    fetchMock.mockResolvedValue(new Response('quota', { status: 429 }))
    await expect(sendEmail(message)).rejects.toThrow('429')
  })
})
```

Run: `npm test -- src/emails src/server/integrations/resend.test.ts` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/emails/html.ts`:

```ts
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

/** HTML já montado por `html`: não é escapado de novo quando interpolado. */
export class SafeHtml {
  constructor(readonly value: string) {}
}

type Value = string | number | SafeHtml | null | undefined | false | Value[]

function render(value: Value): string {
  if (value === null || value === undefined || value === false) return ''
  if (value instanceof SafeHtml) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  return escapeHtml(String(value))
}

/** Template de e-mail seguro por padrão: todo valor interpolado é escapado. */
export function html(strings: TemplateStringsArray, ...values: Value[]): SafeHtml {
  return new SafeHtml(
    strings.reduce((out, chunk, i) => out + chunk + (i < values.length ? render(values[i]) : ''), ''),
  )
}
```

`src/emails/layout.ts`:

```ts
import { formatCep } from '@/lib/cep'
import { formatBRL } from '@/lib/money'
import type { OrderDoc } from '@/server/db/orders'
import { html, type SafeHtml } from './html'

export type EmailOrder = Pick<
  OrderDoc,
  'number' | 'customer' | 'items' | 'totals' | 'shipping' | 'shippingAddress' | 'coupon'
>

export function emailDocument(title: string, body: SafeHtml): string {
  return html`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px">
      <p style="margin:0 0 32px;font-size:20px;font-weight:900;font-style:italic;letter-spacing:.1em;text-transform:uppercase">Street Stars ★</p>
      ${body}
      <p style="margin-top:40px;color:#666;font-size:11px">Street Stars · streetwear produzido sob demanda</p>
    </div>
  </body>
</html>`.value
}

export function heading(text: string): SafeHtml {
  return html`<h1 style="margin:0 0 12px;font-size:22px;font-style:italic;text-transform:uppercase">${text}</h1>`
}

function row(label: string, value: string): SafeHtml {
  return html`<tr><td style="padding:4px 0;color:#999">${label}</td><td style="padding:4px 0;text-align:right">${value}</td></tr>`
}

export function orderDetails(order: EmailOrder): SafeHtml {
  const address = order.shippingAddress
  return html`
<table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:13px">
  ${order.items.map(
    (item) => html`<tr>
    <td style="padding:8px 0;border-bottom:1px solid #222">${item.name}<br /><span style="color:#999;font-size:11px">Tam. ${item.size}${item.color ? ` · ${item.color}` : ''} · Qtd. ${item.qty}</span></td>
    <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right">${formatBRL(item.lineTotalCents)}</td>
  </tr>`,
  )}
</table>
<table style="width:100%;margin-top:12px;font-size:13px">
  ${row('Subtotal', formatBRL(order.totals.subtotalCents))}
  ${order.coupon ? row(`Cupom ${order.coupon.code}`, `− ${formatBRL(order.totals.discountCents)}`) : null}
  ${row(`Frete (${order.shipping.name})`, formatBRL(order.totals.shippingCents))}
  <tr><td style="padding-top:8px;font-weight:700">Total</td><td style="padding-top:8px;text-align:right;font-weight:700">${formatBRL(order.totals.totalCents)}</td></tr>
</table>
<p style="margin-top:24px;color:#ccc;font-size:13px;line-height:1.6">
  <strong style="color:#fff">Entrega</strong><br />
  ${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ''}<br />
  ${address.neighborhood} · ${address.city}/${address.state} · CEP ${formatCep(address.cep)}
</p>`
}
```

`src/emails/order-confirmation.ts`:

```ts
import { html } from './html'
import { emailDocument, heading, orderDetails, type EmailOrder } from './layout'

export function orderConfirmationEmail(order: EmailOrder, orderUrl: string) {
  const { productionDays, deliveryDays } = order.shipping
  const firstName = order.customer.name.trim().split(/\s+/)[0] ?? ''
  const subject = `Pedido ${order.number} confirmado`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Pagamento confirmado')}
<p style="color:#ccc;font-size:14px;line-height:1.6">Oi, ${firstName}! Recebemos o pagamento do pedido <strong style="color:#fff">${order.number}</strong>. Cada peça é produzida sob demanda: o prazo estimado é de até ${productionDays + deliveryDays} dias úteis (${productionDays} de produção + ${deliveryDays} de entrega).</p>
<p style="margin:28px 0"><a href="${orderUrl}" style="display:inline-block;background:#fff;color:#000;padding:14px 24px;font-size:12px;font-weight:900;letter-spacing:.2em;text-decoration:none;text-transform:uppercase">Acompanhar pedido</a></p>
${orderDetails(order)}`,
    ),
  }
}
```

`src/emails/admin-new-order.ts`:

```ts
import { formatCpf } from '@/lib/cpf'
import { formatBRL } from '@/lib/money'
import { formatPhone } from '@/lib/phone'
import { html } from './html'
import { emailDocument, heading, orderDetails, type EmailOrder } from './layout'

export function adminNewOrderEmail(order: EmailOrder) {
  const customer = order.customer
  const subject = `Novo pedido pago ${order.number} · ${formatBRL(order.totals.totalCents)}`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Novo pedido pago')}
<p style="color:#ccc;font-size:14px;line-height:1.6"><strong style="color:#fff">${order.number}</strong><br />${customer.name} · ${customer.email}<br />Telefone ${formatPhone(customer.phone)} · CPF ${formatCpf(customer.cpf)}</p>
<p style="color:#ccc;font-size:13px">Frete escolhido: ${order.shipping.name} (${order.shipping.company}). Compre a etiqueta no painel do Melhor Envio.</p>
${orderDetails(order)}`,
    ),
  }
}
```

`src/emails/admin-alert.ts`:

```ts
import { html } from './html'
import { emailDocument, heading } from './layout'

export function adminAlertEmail(input: { orderNumber: string; message: string }) {
  const subject = `Alerta no pedido ${input.orderNumber}`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Atenção')}<p style="color:#ccc;font-size:14px;line-height:1.6">${input.message}</p>`,
    ),
  }
}
```

`src/server/integrations/resend.ts`:

```ts
import 'server-only'
import { serverEnv } from '@/server/env'

export async function sendEmail(message: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<void> {
  const env = serverEnv()
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    // Desenvolvimento e preview sem Resend: o e-mail só aparece no log.
    console.info('[email não enviado: Resend não configurado]', {
      to: message.to,
      subject: message.subject,
    })
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Resend respondeu ${response.status}`)
}
```

Run: `npm test -- src/emails src/server/integrations/resend.test.ts` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint
git add src/emails src/server/integrations/resend.ts src/server/integrations/resend.test.ts
git commit -m "feat(email): add escaped order email templates and resend client"
```

---

### Task 8: Criação do pedido no servidor

**Files:**
- Create: `src/lib/checkout.ts`, `src/lib/checkout.test.ts`, `src/lib/navigate.ts`, `src/server/checkout/cart.ts`, `src/server/checkout/shipping.ts`, `src/server/checkout/create-order.ts`, `src/server/orders/access.ts`, `src/server/orders/payment.ts`, `tests/integration/create-order.test.ts`

**Interfaces:**
- Consumes: tudo das Tasks 2–6, `sanitizeLines`, `getProductsByIds`, `priceLines`, `PricedCart`, `getStoreSettings`, `publicEnv`, `serverEnv`.
- Produces:
  - `@/lib/checkout`: `checkoutCustomerSchema`, `checkoutAddressSchema`, `createOrderInputSchema`, `type CreateOrderInput = z.input<typeof createOrderInputSchema>`, `type ShippingOption = { serviceId: number; name: string; company: string; priceCents: number; deliveryDays: number; productionDays: number; totalDays: number }`
  - `@/lib/navigate`: `redirectTo(url: string): void`
  - `type CheckoutCart = { priced: PricedCart; products: Product[] }`, `loadCheckoutCart(rawLines: unknown): Promise<CheckoutCart>`
  - `shippingOptionsFor(cep: string, cart: CheckoutCart): Promise<Result<ShippingOption[]>>` (falha: `shipping_unavailable`)
  - `createOrder(rawInput: unknown, ctx: { uid: string | null; now: Date }): Promise<Result<{ redirectUrl: string }>>` — falhas: `invalid_input`, `cart_changed`, `coupon_*`, `shipping_unavailable`, `shipping_changed`, `payment_unavailable`
  - `orderPath(orderId: string): string`, `orderUrl(orderId: string): string`, `getOrderByToken(token: string): Promise<Order | null>`, `isPayable(order: Pick<Order, 'status' | 'expiresAt'>, now?: Date): boolean`
  - `paymentRedirectUrl(order: Order, now?: Date): Promise<string>` (pedido pagável → nova preferência e `initPoint`; senão → URL do pedido)

- [ ] **Step 1: Schemas da entrada (teste primeiro)**

`src/lib/checkout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { checkoutAddressSchema, checkoutCustomerSchema, createOrderInputSchema } from './checkout'

const customer = {
  email: '  Ana@Exemplo.com ',
  name: ' Ana Souza ',
  phone: '(11) 98765-4321',
  cpf: '529.982.247-25',
}
const address = {
  cep: '20040-002',
  street: 'Rua da Assembleia',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Rio de Janeiro',
  state: 'rj',
}

describe('schemas do checkout', () => {
  it('normaliza contato e endereço', () => {
    expect(checkoutCustomerSchema.parse(customer)).toEqual({
      email: 'ana@exemplo.com',
      name: 'Ana Souza',
      phone: '11987654321',
      cpf: '52998224725',
    })
    expect(checkoutAddressSchema.parse(address)).toMatchObject({ cep: '20040002', state: 'RJ' })
  })

  it.each([
    ['email', { ...customer, email: 'ana@' }, 'E-mail inválido'],
    ['cpf', { ...customer, cpf: '111.111.111-11' }, 'CPF inválido'],
    ['phone', { ...customer, phone: '1234' }, 'Telefone inválido'],
    ['name', { ...customer, name: '   ' }, 'Obrigatório'],
  ])('contato: %s inválido', (field, input, message) => {
    const result = checkoutCustomerSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues.find((issue) => issue.path[0] === field)?.message).toBe(message)
  })

  it('endereço: CEP e UF inválidos', () => {
    const result = checkoutAddressSchema.safeParse({ ...address, cep: '123', state: 'R' })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['cep', 'state'])
  })

  it('a entrada do pedido descarta campos que o cliente não manda (preço, frete)', () => {
    const parsed = createOrderInputSchema.parse({
      idempotencyKey: '2f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b',
      lines: [],
      customer,
      address,
      serviceId: 1,
      couponCode: null,
      shippingPriceCents: 1,
      totals: { totalCents: 1 },
    })
    expect(parsed).not.toHaveProperty('shippingPriceCents')
    expect(parsed).not.toHaveProperty('totals')
  })
})
```

`src/lib/checkout.ts`:

```ts
import { z } from 'zod'
import { isValidCep, normalizeCep } from './cep'
import { isValidCpf, normalizeCpf } from './cpf'
import { isValidPhone, normalizePhone } from './phone'

const text = (max: number) => z.string().trim().min(1, 'Obrigatório').max(max, 'Muito longo')

export const checkoutCustomerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('E-mail inválido')),
  name: text(80),
  phone: z.string().transform(normalizePhone).refine(isValidPhone, 'Telefone inválido'),
  cpf: z.string().transform(normalizeCpf).refine(isValidCpf, 'CPF inválido'),
})

export const checkoutAddressSchema = z.object({
  cep: z.string().transform(normalizeCep).refine(isValidCep, 'CEP inválido'),
  street: text(120),
  number: text(20),
  complement: z.string().trim().max(60, 'Muito longo'),
  neighborhood: text(80),
  city: text(80),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'UF inválida'),
})

export const createOrderInputSchema = z.object({
  idempotencyKey: z.uuid(),
  /** Linhas cruas do localStorage: o servidor sanitiza e precifica. */
  lines: z.unknown(),
  customer: checkoutCustomerSchema,
  address: checkoutAddressSchema,
  serviceId: z.number().int().positive(),
  couponCode: z.string().trim().max(32).nullable(),
})

export type CreateOrderInput = z.input<typeof createOrderInputSchema>

export type ShippingOption = {
  serviceId: number
  name: string
  company: string
  priceCents: number
  deliveryDays: number
  productionDays: number
  /** Prazo exibido: produção + entrega, em dias úteis. */
  totalDays: number
}
```

`src/lib/navigate.ts`:

```ts
/** Navegação para fora do app (Mercado Pago). Isolada para os testes poderem simular. */
export function redirectTo(url: string): void {
  window.location.assign(url)
}
```

Run: `npm test -- src/lib/checkout.test.ts` → Expected: PASS (escrever o teste antes, ver falhar pela ausência do módulo, depois criar o módulo).

- [ ] **Step 2: Teste de integração do `createOrder`**

`tests/integration/create-order.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const quoteShipping = vi.hoisted(() => vi.fn())
const createPreference = vi.hoisted(() => vi.fn())
vi.mock('@/server/integrations/melhorenvio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/melhorenvio')>()),
  quoteShipping,
}))
vi.mock('@/server/integrations/mercadopago', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/mercadopago')>()),
  createPreference,
}))

import { createOrder } from '@/server/checkout/create-order'
import { db } from '@/server/db/firebase-admin'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { NOW, productDoc } from './fixtures'
import { clearFirestore } from './helpers'

const DAY = 24 * 60 * 60 * 1000
const KEY = '2f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b'
const QUOTES = [
  { serviceId: 1, name: 'PAC', company: 'Correios', priceCents: 2500, deliveryDays: 8 },
  { serviceId: 2, name: 'SEDEX', company: 'Correios', priceCents: 4000, deliveryDays: 3 },
]

function input(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: KEY,
    lines: [{ productId: 'p1', size: 'M', color: 'Preto', qty: 2 }],
    customer: {
      email: 'Ana@Exemplo.com',
      name: 'Ana Souza',
      phone: '(11) 98765-4321',
      cpf: '529.982.247-25',
    },
    address: {
      cep: '20040-002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    serviceId: 1,
    couponCode: null,
    ...overrides,
  }
}

const ctx = { uid: null, now: NOW }

async function allOrders() {
  return (await ordersCollection().get()).docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

beforeEach(async () => {
  await clearFirestore()
  vi.resetAllMocks()
  quoteShipping.mockResolvedValue(QUOTES)
  let n = 0
  createPreference.mockImplementation(async () => {
    n += 1
    return { preferenceId: `pref-${n}`, initPoint: `https://mp.test/init/${n}` }
  })
  await db().doc('products/p1').set(productDoc())
  await db().doc('settings/store').set({ originCep: '01001000' })
})

describe('createOrder', () => {
  it('cria o pedido com preços do catálogo e frete cotado no servidor', async () => {
    const result = await createOrder(
      input({ shippingPriceCents: 1, totals: { totalCents: 1 } }),
      { uid: 'u1', now: NOW },
    )
    expect(result).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/1' } })

    const [order] = await allOrders()
    expect(order).toMatchObject({
      number: 'SS-1001',
      idempotencyKey: KEY,
      status: 'pending_payment',
      customer: {
        uid: 'u1',
        email: 'ana@exemplo.com',
        name: 'Ana Souza',
        phone: '11987654321',
        cpf: '52998224725',
      },
      items: [{ productId: 'p1', unitPriceCents: 14990, qty: 2, lineTotalCents: 29980 }],
      shippingAddress: { cep: '20040002', state: 'RJ' },
      shipping: { serviceId: 1, name: 'PAC', priceCents: 2500, deliveryDays: 8, productionDays: 10 },
      coupon: null,
      totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
      statusHistory: [{ status: 'pending_payment', at: NOW, by: 'system' }],
      payment: { preferenceId: 'pref-1', paymentId: null },
      expiresAt: new Date(NOW.getTime() + 2 * DAY),
    })

    expect(quoteShipping).toHaveBeenCalledWith({
      fromCep: '01001000',
      toCep: '20040002',
      weightGrams: 500,
      package: { heightCm: 5, widthCm: 30, lengthCm: 30 },
    })
    const body = createPreference.mock.calls[0]?.[0]
    expect(body.external_reference).toBe(order?.id)
    expect(body.back_urls.success).toMatch(new RegExp(`^http://localhost:3000/pedido/${order?.id}\\.`))
    expect(body.notification_url).toBe(
      'http://localhost:3000/api/webhooks/mercadopago?source_news=webhooks',
    )
  })

  it('numera pedidos diferentes em sequência', async () => {
    await createOrder(input(), ctx)
    await createOrder(input({ idempotencyKey: '3f1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }), ctx)
    expect((await allOrders()).map((order) => order.number).sort()).toEqual(['SS-1001', 'SS-1002'])
  })

  it('mesma chave devolve o mesmo pedido com um link de pagamento novo', async () => {
    const first = await createOrder(input(), ctx)
    const second = await createOrder(input({ serviceId: 2 }), ctx)
    expect(first).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/1' } })
    expect(second).toEqual({ ok: true, data: { redirectUrl: 'https://mp.test/init/2' } })
    const orders = await allOrders()
    expect(orders).toHaveLength(1)
    expect(orders[0]?.shipping.serviceId).toBe(1)
  })

  it('mesma chave de pedido já pago leva para a página do pedido', async () => {
    await createOrder(input(), ctx)
    const [order] = await allOrders()
    await db().doc(`orders/${order?.id}`).update({ status: 'paid' })
    const again = await createOrder(input(), ctx)
    expect(again.ok && again.data.redirectUrl).toMatch(/^http:\/\/localhost:3000\/pedido\//)
    expect(createPreference).toHaveBeenCalledTimes(1)
  })

  it('Mercado Pago fora do ar: erro, pedido pendente e nova tentativa reaproveita', async () => {
    createPreference.mockRejectedValueOnce(new Error('MP 503'))
    expect(await createOrder(input(), ctx)).toMatchObject({ ok: false, code: 'payment_unavailable' })
    const retry = await createOrder(input(), ctx)
    expect(retry.ok).toBe(true)
    const orders = await allOrders()
    expect(orders).toHaveLength(1)
    expect(orders[0]?.status).toBe('pending_payment')
  })

  it('recusa produto que deixou de estar à venda', async () => {
    await db().doc('products/p1').update({ status: 'draft' })
    expect(await createOrder(input(), ctx)).toMatchObject({ ok: false, code: 'cart_changed' })
    expect(await allOrders()).toEqual([])
  })

  it('recusa tamanho que não existe', async () => {
    const result = await createOrder(
      input({ lines: [{ productId: 'p1', size: 'XG', color: 'Preto', qty: 1 }] }),
      ctx,
    )
    expect(result).toMatchObject({ ok: false, code: 'cart_changed' })
  })

  it('recusa frete que o Melhor Envio não ofereceu', async () => {
    expect(await createOrder(input({ serviceId: 99 }), ctx)).toMatchObject({
      ok: false,
      code: 'shipping_changed',
    })
  })

  it('frete indisponível (sem CEP de origem ou erro no Melhor Envio)', async () => {
    quoteShipping.mockRejectedValueOnce(new Error('timeout'))
    expect(await createOrder(input(), ctx)).toMatchObject({ ok: false, code: 'shipping_unavailable' })
    await db().doc('settings/store').set({ originCep: '' })
    expect(await createOrder(input(), ctx)).toMatchObject({ ok: false, code: 'shipping_unavailable' })
  })

  it('aplica cupom válido e recusa expirado ou esgotado', async () => {
    const coupon = {
      type: 'percent',
      value: 10,
      minSubtotalCents: null,
      startsAt: null,
      endsAt: null,
      maxUses: null,
      usedCount: 0,
      active: true,
    }
    await db().doc('coupons/BEMVINDO').set(coupon)
    await db().doc('coupons/VELHO').set({ ...coupon, endsAt: new Date(NOW.getTime() - DAY) })
    await db().doc('coupons/ESGOTADO').set({ ...coupon, maxUses: 5, usedCount: 5 })

    expect(await createOrder(input({ couponCode: 'velho' }), ctx)).toMatchObject({
      ok: false,
      code: 'coupon_expired',
    })
    expect(await createOrder(input({ couponCode: 'ESGOTADO' }), ctx)).toMatchObject({
      ok: false,
      code: 'coupon_exhausted',
    })

    expect((await createOrder(input({ couponCode: 'bemvindo' }), ctx)).ok).toBe(true)
    const [order] = await allOrders()
    expect(order?.coupon).toEqual({ code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 })
    expect(order?.totals).toEqual({
      subtotalCents: 29980,
      discountCents: 2998,
      shippingCents: 2500,
      totalCents: 29482,
    })
    expect(createPreference.mock.calls[0]?.[0].items).toEqual([
      { id: 'SS-1001', title: 'Pedido SS-1001', quantity: 1, unit_price: 294.82, currency_id: 'BRL' },
    ])
  })

  it('recusa entrada inválida sem tocar no banco', async () => {
    const result = await createOrder(input({ customer: { email: 'x' } }), ctx)
    expect(result).toMatchObject({ ok: false, code: 'invalid_input' })
    expect(quoteShipping).not.toHaveBeenCalled()
  })

  it('o pedido gravado passa pelo schema (getOrder lê sem erro)', async () => {
    await createOrder(input(), ctx)
    const [order] = await allOrders()
    expect(await getOrder(order?.id ?? '')).not.toBeNull()
  })
})
```

Run: `make test-emulator` → Expected: FAIL (`@/server/checkout/create-order` não existe).

- [ ] **Step 3: Implementar carrinho, frete, acesso, pagamento e `createOrder`**

`src/server/checkout/cart.ts`:

```ts
import 'server-only'
import { sanitizeLines } from '@/lib/cart'
import { getProductsByIds, type Product } from '@/server/db/products'
import { priceLines, type PricedCart } from '@/server/domain/cart-pricing'

export type CheckoutCart = { priced: PricedCart; products: Product[] }

export async function loadCheckoutCart(rawLines: unknown): Promise<CheckoutCart> {
  const lines = sanitizeLines(rawLines)
  const products = lines.length > 0 ? await getProductsByIds(lines.map((l) => l.productId)) : []
  return { priced: priceLines(lines, products), products }
}
```

`src/server/checkout/shipping.ts`:

```ts
import 'server-only'
import type { ShippingOption } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import { getStoreSettings } from '@/server/db/settings'
import { cartPackage } from '@/server/domain/shipping-estimate'
import { quoteShipping } from '@/server/integrations/melhorenvio'
import type { CheckoutCart } from './cart'

const UNAVAILABLE = 'Frete indisponível no momento. Tente novamente em instantes.'

export async function shippingOptionsFor(
  cep: string,
  cart: CheckoutCart,
): Promise<Result<ShippingOption[]>> {
  const settings = await getStoreSettings()
  if (!settings.originCep) {
    console.error('Frete: settings/store.originCep está vazio')
    return fail('shipping_unavailable', UNAVAILABLE)
  }

  try {
    const pkg = cartPackage(cart.priced.lines, cart.products)
    const quotes = await quoteShipping({
      fromCep: settings.originCep,
      toCep: cep,
      weightGrams: pkg.weightGrams,
      package: settings.package,
    })
    if (quotes.length === 0) {
      return fail('shipping_unavailable', 'Não encontramos opções de frete para este CEP.')
    }
    return ok(
      quotes.map((quote) => ({
        ...quote,
        productionDays: pkg.productionDays,
        totalDays: pkg.productionDays + quote.deliveryDays,
      })),
    )
  } catch (error) {
    console.error('Frete: falha na cotação', { cep, error })
    return fail('shipping_unavailable', UNAVAILABLE)
  }
}
```

`src/server/orders/access.ts`:

```ts
import 'server-only'
import { publicEnv } from '@/lib/env'
import { getOrder, type Order } from '@/server/db/orders'
import { createOrderToken, readOrderToken } from '@/server/domain/order-token'
import { serverEnv } from '@/server/env'

export function orderPath(orderId: string): string {
  return `/pedido/${createOrderToken(orderId, serverEnv().ORDER_TOKEN_SECRET)}`
}

export function orderUrl(orderId: string): string {
  return new URL(orderPath(orderId), publicEnv().NEXT_PUBLIC_SITE_URL).toString()
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  const orderId = readOrderToken(token, serverEnv().ORDER_TOKEN_SECRET)
  return orderId ? getOrder(orderId) : null
}

/** Pendente e dentro das 48 h: pode gerar link de pagamento. */
export function isPayable(order: Pick<Order, 'status' | 'expiresAt'>, now = new Date()): boolean {
  return order.status === 'pending_payment' && order.expiresAt > now
}
```

`src/server/orders/payment.ts`:

```ts
import 'server-only'
import { publicEnv } from '@/lib/env'
import { db } from '@/server/db/firebase-admin'
import type { Order } from '@/server/db/orders'
import { buildPreferenceBody, createPreference } from '@/server/integrations/mercadopago'
import { isPayable, orderUrl } from './access'

/** Pedido pagável → nova preferência no MP (link de pagamento); senão → página do pedido. */
export async function paymentRedirectUrl(order: Order, now = new Date()): Promise<string> {
  const url = orderUrl(order.id)
  if (!isPayable(order, now)) return url

  const notificationUrl = new URL(
    '/api/webhooks/mercadopago?source_news=webhooks',
    publicEnv().NEXT_PUBLIC_SITE_URL,
  ).toString()
  const preference = await createPreference(
    buildPreferenceBody(order, { orderUrl: url, notificationUrl }),
  )
  await db()
    .doc(`orders/${order.id}`)
    .update({ 'payment.preferenceId': preference.preferenceId, updatedAt: now })
  return preference.initPoint
}
```

`src/server/checkout/create-order.ts`:

```ts
import 'server-only'
import { createOrderInputSchema } from '@/lib/checkout'
import { fail, ok, type Result } from '@/lib/result'
import { getCouponRule } from '@/server/db/coupons'
import { db } from '@/server/db/firebase-admin'
import {
  findOrderByIdempotencyKey,
  idempotencyQuery,
  nextOrderNumber,
  ordersCollection,
  type Order,
  type OrderDoc,
} from '@/server/db/orders'
import { applyCoupon, type AppliedCoupon } from '@/server/domain/coupons'
import { computeTotals } from '@/server/domain/pricing'
import { paymentRedirectUrl } from '@/server/orders/payment'
import { loadCheckoutCart } from './cart'
import { shippingOptionsFor } from './shipping'

const ORDER_TTL_MS = 48 * 60 * 60 * 1000

type Context = { uid: string | null; now: Date }

export async function createOrder(
  rawInput: unknown,
  ctx: Context,
): Promise<Result<{ redirectUrl: string }>> {
  const parsed = createOrderInputSchema.safeParse(rawInput)
  if (!parsed.success) return fail('invalid_input', 'Confira os dados do pedido.')
  const input = parsed.data

  // Clique duplo ou nova tentativa: reaproveita o pedido e gera outro link de pagamento.
  const existing = await findOrderByIdempotencyKey(input.idempotencyKey)
  if (existing) return redirectFor(existing, ctx.now)

  const cart = await loadCheckoutCart(input.lines)
  if (cart.priced.lines.length === 0 || cart.priced.removedKeys.length > 0) {
    return fail('cart_changed', 'Sua sacola mudou. Revise os itens antes de pagar.')
  }

  let coupon: AppliedCoupon | null = null
  if (input.couponCode) {
    const applied = applyCoupon(
      await getCouponRule(input.couponCode),
      cart.priced.subtotalCents,
      ctx.now,
    )
    if (!applied.ok) return applied
    coupon = applied.data
  }

  // O frete é sempre recotado aqui: preço vindo do navegador nunca é usado.
  const options = await shippingOptionsFor(input.address.cep, cart)
  if (!options.ok) return options
  const shipping = options.data.find((option) => option.serviceId === input.serviceId)
  if (!shipping) {
    return fail('shipping_changed', 'A opção de frete escolhida mudou. Escolha o frete de novo.')
  }

  const totals = computeTotals({
    subtotalCents: cart.priced.subtotalCents,
    discountCents: coupon?.discountCents ?? 0,
    shippingCents: shipping.priceCents,
  })

  const order = await db().runTransaction(async (tx): Promise<Order> => {
    const duplicate = (await tx.get(idempotencyQuery(input.idempotencyKey))).docs[0]
    if (duplicate) return { id: duplicate.id, ...duplicate.data() }

    const number = await nextOrderNumber(tx)
    const ref = ordersCollection().doc()
    const doc: OrderDoc = {
      number,
      idempotencyKey: input.idempotencyKey,
      customer: { uid: ctx.uid, ...input.customer },
      items: cart.priced.lines.map((line) => ({
        productId: line.productId,
        slug: line.slug,
        name: line.name,
        image: line.image,
        size: line.size,
        color: line.color,
        unitPriceCents: line.unitPriceCents,
        qty: line.qty,
        lineTotalCents: line.lineTotalCents,
      })),
      shippingAddress: input.address,
      shipping: {
        serviceId: shipping.serviceId,
        name: shipping.name,
        company: shipping.company,
        priceCents: shipping.priceCents,
        deliveryDays: shipping.deliveryDays,
        productionDays: shipping.productionDays,
      },
      coupon,
      totals,
      status: 'pending_payment',
      statusHistory: [{ status: 'pending_payment', at: ctx.now, by: 'system' }],
      payment: {
        preferenceId: null,
        paymentId: null,
        status: null,
        method: null,
        paidAmountCents: null,
        paidAt: null,
      },
      tracking: null,
      notifications: { confirmationSentAt: null, shippedSentAt: null, adminAlertSentAt: null },
      createdAt: ctx.now,
      updatedAt: ctx.now,
      expiresAt: new Date(ctx.now.getTime() + ORDER_TTL_MS),
    }
    tx.create(ref, doc)
    return { id: ref.id, ...doc }
  })

  return redirectFor(order, ctx.now)
}

async function redirectFor(order: Order, now: Date): Promise<Result<{ redirectUrl: string }>> {
  try {
    return ok({ redirectUrl: await paymentRedirectUrl(order, now) })
  } catch (error) {
    console.error('createOrder: falha ao criar a preferência', { orderId: order.id, error })
    return fail(
      'payment_unavailable',
      'Não foi possível abrir o pagamento agora. Tente de novo em instantes.',
    )
  }
}
```

Run: `make test-emulator` → Expected: PASS.

- [ ] **Step 4: Commit**

```bash
npm test && npm run typecheck && npm run lint
git add src/lib/checkout.ts src/lib/checkout.test.ts src/lib/navigate.ts src/server/checkout src/server/orders/access.ts src/server/orders/payment.ts tests/integration/create-order.test.ts
git commit -m "feat(checkout): create orders server-side with idempotency and payment link"
```

---

### Task 9: Decisão de pagamento (regra pura do webhook)

**Files:**
- Create: `src/server/domain/payment-outcome.ts`, `src/server/domain/payment-outcome.test.ts`

**Interfaces:**
- Consumes: `canTransition` (Task 2), `OrderStatus`.
- Produces:
  - `type PaymentEvent = { id: string; status: string; amountCents: number }`
  - `type OrderPaymentState = { status: OrderStatus; totalCents: number; payment: { paymentId: string | null; status: string | null }; handledPaymentIds: string[] }`
  - `type PaymentOutcome = { kind: 'ignore' } | { kind: 'record' } | { kind: 'transition'; to: 'paid' | 'refunded' } | { kind: 'alert'; reason: 'amount_mismatch' | 'unexpected_payment' }`
  - `decidePaymentOutcome(order: OrderPaymentState, payment: PaymentEvent): PaymentOutcome`

- [ ] **Step 1: Escrever os testes**

`src/server/domain/payment-outcome.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { decidePaymentOutcome, type OrderPaymentState } from './payment-outcome'

const pending: OrderPaymentState = {
  status: 'pending_payment',
  totalCents: 32480,
  payment: { paymentId: null, status: null },
  handledPaymentIds: [],
}
const paid: OrderPaymentState = {
  status: 'paid',
  totalCents: 32480,
  payment: { paymentId: '1', status: 'approved' },
  handledPaymentIds: ['1'],
}
const approved = { id: '1', status: 'approved', amountCents: 32480 }

describe('decidePaymentOutcome', () => {
  it('aprovado com o valor certo → pago', () => {
    expect(decidePaymentOutcome(pending, approved)).toEqual({ kind: 'transition', to: 'paid' })
  })

  it('expirado ainda vira pago', () => {
    expect(decidePaymentOutcome({ ...pending, status: 'expired' }, approved)).toEqual({
      kind: 'transition',
      to: 'paid',
    })
  })

  it('evento repetido não muda nada', () => {
    expect(decidePaymentOutcome(paid, approved)).toEqual({ kind: 'ignore' })
  })

  it('aprovado com valor divergente → alerta, sem pagar', () => {
    expect(decidePaymentOutcome(pending, { ...approved, amountCents: 100 })).toEqual({
      kind: 'alert',
      reason: 'amount_mismatch',
    })
  })

  it('alerta já registrado para o mesmo pagamento não repete', () => {
    const alerted = { ...pending, handledPaymentIds: ['1'] }
    expect(decidePaymentOutcome(alerted, { ...approved, amountCents: 100 })).toEqual({
      kind: 'ignore',
    })
  })

  it('segundo pagamento aprovado num pedido pago → alerta de cobrança em dobro', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2' })).toEqual({
      kind: 'alert',
      reason: 'unexpected_payment',
    })
  })

  it('pagamento aprovado num pedido cancelado → alerta', () => {
    expect(decidePaymentOutcome({ ...pending, status: 'cancelled' }, approved)).toEqual({
      kind: 'alert',
      reason: 'unexpected_payment',
    })
  })

  it.each(['rejected', 'cancelled', 'pending', 'in_process'])(
    '%s com pedido aguardando → só registra',
    (status) => {
      expect(decidePaymentOutcome(pending, { ...approved, id: '2', status })).toEqual({
        kind: 'record',
      })
    },
  )

  it('recusado depois de aprovado não regride', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2', status: 'rejected' })).toEqual({
      kind: 'ignore',
    })
  })

  it.each(['refunded', 'charged_back'])('%s do pagamento do pedido → estornado', (status) => {
    expect(decidePaymentOutcome(paid, { ...approved, status })).toEqual({
      kind: 'transition',
      to: 'refunded',
    })
    expect(
      decidePaymentOutcome({ ...paid, status: 'shipped' }, { ...approved, status }),
    ).toEqual({ kind: 'transition', to: 'refunded' })
  })

  it('estorno de outro pagamento (o duplicado) não estorna o pedido', () => {
    expect(decidePaymentOutcome(paid, { ...approved, id: '2', status: 'refunded' })).toEqual({
      kind: 'ignore',
    })
  })
})
```

Run: `npm test -- src/server/domain/payment-outcome.test.ts` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/server/domain/payment-outcome.ts`:

```ts
import 'server-only'
import type { OrderStatus } from '@/lib/order-status'
import { canTransition } from './order-status'

export type PaymentEvent = { id: string; status: string; amountCents: number }

export type OrderPaymentState = {
  status: OrderStatus
  totalCents: number
  payment: { paymentId: string | null; status: string | null }
  /** Pagamentos que já geraram entrada no histórico (pago ou alerta). */
  handledPaymentIds: string[]
}

export type PaymentOutcome =
  | { kind: 'ignore' }
  /** Só atualiza payment.* (pedido continua aguardando). */
  | { kind: 'record' }
  | { kind: 'transition'; to: 'paid' | 'refunded' }
  /** Registra no histórico e avisa a loja; o status não muda. */
  | { kind: 'alert'; reason: 'amount_mismatch' | 'unexpected_payment' }

/** O pagamento vem da API do MP (fonte da verdade), não do corpo do webhook. */
export function decidePaymentOutcome(
  order: OrderPaymentState,
  payment: PaymentEvent,
): PaymentOutcome {
  if (order.payment.paymentId === payment.id && order.payment.status === payment.status) {
    return { kind: 'ignore' }
  }
  const waiting = order.status === 'pending_payment' || order.status === 'expired'

  switch (payment.status) {
    case 'approved':
      if (order.handledPaymentIds.includes(payment.id)) return { kind: 'ignore' }
      if (payment.amountCents !== order.totalCents) {
        return { kind: 'alert', reason: 'amount_mismatch' }
      }
      if (canTransition(order.status, 'paid')) return { kind: 'transition', to: 'paid' }
      // Pedido cancelado ou já pago por outro pagamento: dinheiro entrou sem pedido esperando.
      return { kind: 'alert', reason: 'unexpected_payment' }
    case 'refunded':
    case 'charged_back':
      return order.payment.paymentId === payment.id && canTransition(order.status, 'refunded')
        ? { kind: 'transition', to: 'refunded' }
        : { kind: 'ignore' }
    default:
      // rejected, cancelled, pending, in_process...: o cliente ainda pode tentar de novo.
      return waiting ? { kind: 'record' } : { kind: 'ignore' }
  }
}
```

Run: `npm test -- src/server/domain/payment-outcome.test.ts` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/server/domain/payment-outcome.ts src/server/domain/payment-outcome.test.ts
git commit -m "feat(payment): decide order changes from mercado pago payment status"
```

---

### Task 10: Webhook do Mercado Pago

**Files:**
- Create: `src/server/orders/order-emails.ts`, `src/server/orders/payment-notification.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/app/api/webhooks/mercadopago/route.test.ts`, `tests/integration/payment-notification.test.ts`

**Interfaces:**
- Consumes: `getPayment`, `MpPayment`, `verifyMercadoPagoSignature` (Task 6), `decidePaymentOutcome` (Task 9), templates e `sendEmail` (Task 7), `ordersCollection`, `getOrder` (Task 4), `orderUrl` (Task 8), `getStoreSettings`, `isPaidStatus`.
- Produces:
  - `sendPaidOrderEmails(orderId: string, now?: Date): Promise<void>` (envia o que falta e grava `notifications.*SentAt`; lança se o envio falhar)
  - `sendAdminAlert(orderNumber: string, message: string): Promise<void>` (nunca lança)
  - `handlePaymentNotification(paymentId: string, now?: Date): Promise<'processed' | 'ignored'>` (lança em erro temporário)
  - `POST /api/webhooks/mercadopago` → 401 assinatura inválida, 200 processado/ignorado, 500 erro temporário

- [ ] **Step 1: Teste de integração do processamento**

`tests/integration/payment-notification.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPayment = vi.hoisted(() => vi.fn())
const sendEmail = vi.hoisted(() => vi.fn())
vi.mock('@/server/integrations/mercadopago', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/integrations/mercadopago')>()),
  getPayment,
}))
vi.mock('@/server/integrations/resend', () => ({ sendEmail }))

import { db } from '@/server/db/firebase-admin'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { handlePaymentNotification } from '@/server/orders/payment-notification'
import { orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

const STORE_EMAIL = 'streetstars.company@gmail.com'

const payment = (overrides: Record<string, unknown> = {}) => ({
  id: '9001',
  status: 'approved',
  externalReference: 'o1',
  amountCents: 32480,
  method: 'pix',
  approvedAt: new Date('2026-10-04T13:00:00.000Z'),
  ...overrides,
})

async function couponUses() {
  return (await db().doc('coupons/BEMVINDO').get()).get('usedCount')
}

beforeEach(async () => {
  await clearFirestore()
  vi.resetAllMocks()
  sendEmail.mockResolvedValue(undefined)
  await ordersCollection()
    .doc('o1')
    .set(orderDoc({ coupon: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 0 } }))
  await db().doc('coupons/BEMVINDO').set({ usedCount: 0 })
})

describe('handlePaymentNotification', () => {
  it('aprovado com o valor certo: pago, cupom contado e e-mails enviados uma vez', async () => {
    getPayment.mockResolvedValue(payment())
    expect(await handlePaymentNotification('9001')).toBe('processed')

    const order = await getOrder('o1')
    expect(order).toMatchObject({
      status: 'paid',
      payment: {
        paymentId: '9001',
        status: 'approved',
        method: 'pix',
        paidAmountCents: 32480,
        paidAt: new Date('2026-10-04T13:00:00.000Z'),
      },
    })
    expect(order?.statusHistory.at(-1)).toMatchObject({
      status: 'paid',
      by: 'webhook',
      paymentId: '9001',
    })
    expect(order?.notifications.confirmationSentAt).toBeInstanceOf(Date)
    expect(order?.notifications.adminAlertSentAt).toBeInstanceOf(Date)
    expect(await couponUses()).toBe(1)
    expect(sendEmail.mock.calls.map(([message]) => message.to)).toEqual([
      'ana@exemplo.com',
      STORE_EMAIL,
    ])
    expect(sendEmail.mock.calls[0]?.[0].html).toContain('/pedido/o1.')

    // Mesmo evento de novo (o MP reenvia): nada muda.
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    expect(await couponUses()).toBe(1)
    expect(sendEmail).toHaveBeenCalledTimes(2)
  })

  it('valor divergente: continua pendente, registra e alerta a loja uma vez', async () => {
    getPayment.mockResolvedValue(payment({ amountCents: 100 }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    const order = await getOrder('o1')
    expect(order?.status).toBe('pending_payment')
    expect(order?.statusHistory.at(-1)?.note).toMatch(/não foi marcado como pago/)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0]?.[0]).toMatchObject({
      to: STORE_EMAIL,
      subject: 'Alerta no pedido SS-1001',
    })

    await handlePaymentNotification('9001')
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(await couponUses()).toBe(0)
  })

  it('recusado depois de aprovado não regride', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    getPayment.mockResolvedValueOnce(payment({ id: '9002', status: 'rejected' }))
    expect(await handlePaymentNotification('9002')).toBe('ignored')
    expect((await getOrder('o1'))?.status).toBe('paid')
  })

  it('recusado com pedido pendente só registra o status do pagamento', async () => {
    getPayment.mockResolvedValue(payment({ status: 'rejected' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect(await getOrder('o1')).toMatchObject({
      status: 'pending_payment',
      payment: { paymentId: '9001', status: 'rejected' },
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('pedido expirado ainda vira pago', async () => {
    await db().doc('orders/o1').update({ status: 'expired' })
    getPayment.mockResolvedValue(payment())
    await handlePaymentNotification('9001')
    expect((await getOrder('o1'))?.status).toBe('paid')
  })

  it('estorno do pagamento do pedido → estornado', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    getPayment.mockResolvedValueOnce(payment({ status: 'refunded' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect((await getOrder('o1'))?.status).toBe('refunded')
  })

  it('pagamento sem pedido, de pedido inexistente ou id inválido é ignorado', async () => {
    getPayment.mockResolvedValueOnce(payment({ externalReference: null }))
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    getPayment.mockResolvedValueOnce(payment({ externalReference: 'nao-existe' }))
    expect(await handlePaymentNotification('9001')).toBe('ignored')
    expect(await handlePaymentNotification('abc')).toBe('ignored')
    expect(getPayment).toHaveBeenCalledTimes(2)
  })

  it('falha no e-mail propaga (500) e a próxima entrega envia o que faltou', async () => {
    getPayment.mockResolvedValue(payment())
    sendEmail.mockRejectedValueOnce(new Error('resend fora'))
    await expect(handlePaymentNotification('9001')).rejects.toThrow('resend fora')
    let order = await getOrder('o1')
    expect(order?.status).toBe('paid')
    expect(order?.notifications.confirmationSentAt).toBeNull()

    await handlePaymentNotification('9001')
    order = await getOrder('o1')
    expect(order?.notifications.confirmationSentAt).toBeInstanceOf(Date)
    expect(order?.notifications.adminAlertSentAt).toBeInstanceOf(Date)
    expect(sendEmail).toHaveBeenCalledTimes(3)
    expect(await couponUses()).toBe(1)
  })
})
```

Run: `make test-emulator` → Expected: FAIL.

- [ ] **Step 2: Implementar e-mails do pedido e processamento**

`src/server/orders/order-emails.ts`:

```ts
import 'server-only'
import { adminAlertEmail } from '@/emails/admin-alert'
import { adminNewOrderEmail } from '@/emails/admin-new-order'
import { orderConfirmationEmail } from '@/emails/order-confirmation'
import { isPaidStatus } from '@/lib/order-status'
import { db } from '@/server/db/firebase-admin'
import { getOrder } from '@/server/db/orders'
import { getStoreSettings } from '@/server/db/settings'
import { sendEmail } from '@/server/integrations/resend'
import { orderUrl } from './access'

/** Envia o que ainda falta para um pedido pago. Lança se o envio falhar (o MP reenvia). */
export async function sendPaidOrderEmails(orderId: string, now = new Date()): Promise<void> {
  const order = await getOrder(orderId)
  if (!order || !isPaidStatus(order.status)) return
  const { email: storeEmail } = await getStoreSettings()
  const ref = db().doc(`orders/${orderId}`)

  if (!order.notifications.confirmationSentAt) {
    await sendEmail({
      to: order.customer.email,
      replyTo: storeEmail,
      ...orderConfirmationEmail(order, orderUrl(order.id)),
    })
    await ref.update({ 'notifications.confirmationSentAt': now })
  }
  if (!order.notifications.adminAlertSentAt) {
    await sendEmail({ to: storeEmail, ...adminNewOrderEmail(order) })
    await ref.update({ 'notifications.adminAlertSentAt': now })
  }
}

/** Alerta à loja. Falha só vai para o log: o histórico do pedido já registrou o problema. */
export async function sendAdminAlert(orderNumber: string, message: string): Promise<void> {
  try {
    const { email } = await getStoreSettings()
    await sendEmail({ to: email, ...adminAlertEmail({ orderNumber, message }) })
  } catch (error) {
    console.error('Alerta à loja não enviado', { orderNumber, message, error })
  }
}
```

`src/server/orders/payment-notification.ts`:

```ts
import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { formatBRL } from '@/lib/money'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/order-status'
import { db } from '@/server/db/firebase-admin'
import { ordersCollection, type OrderDoc } from '@/server/db/orders'
import { decidePaymentOutcome, type PaymentOutcome } from '@/server/domain/payment-outcome'
import { getPayment, type MpPayment } from '@/server/integrations/mercadopago'
import { sendAdminAlert, sendPaidOrderEmails } from './order-emails'

const ORDER_ID = /^[A-Za-z0-9]{1,64}$/

type AlertReason = Extract<PaymentOutcome, { kind: 'alert' }>['reason']

function alertNote(reason: AlertReason, payment: MpPayment, order: OrderDoc): string {
  return reason === 'amount_mismatch'
    ? `Pagamento ${payment.id} aprovado com ${formatBRL(payment.amountCents)}, mas o pedido custa ${formatBRL(order.totals.totalCents)}. O pedido não foi marcado como pago.`
    : `Pagamento ${payment.id} aprovado para um pedido com status "${ORDER_STATUS_LABELS[order.status]}". Confira no Mercado Pago se é cobrança em dobro ou se precisa estornar.`
}

function paymentUpdates(
  order: OrderDoc,
  payment: MpPayment,
  outcome: PaymentOutcome,
  now: Date,
): Record<string, unknown> | null {
  const paymentFields = {
    'payment.paymentId': payment.id,
    'payment.status': payment.status,
    'payment.method': payment.method,
  }
  const history = (status: OrderStatus, note?: string) =>
    FieldValue.arrayUnion({
      status,
      at: now,
      by: 'webhook',
      paymentId: payment.id,
      ...(note ? { note } : {}),
    })

  switch (outcome.kind) {
    case 'ignore':
      return null
    case 'record':
      return { ...paymentFields, updatedAt: now }
    case 'transition':
      return outcome.to === 'paid'
        ? {
            ...paymentFields,
            'payment.paidAmountCents': payment.amountCents,
            'payment.paidAt': payment.approvedAt ?? now,
            status: 'paid',
            statusHistory: history('paid'),
            updatedAt: now,
          }
        : {
            'payment.status': payment.status,
            status: 'refunded',
            statusHistory: history('refunded'),
            updatedAt: now,
          }
    case 'alert': {
      // Pedido já pago guarda os dados do pagamento certo (o estorno depende deles).
      const waiting = order.status === 'pending_payment' || order.status === 'expired'
      return {
        ...(waiting ? paymentFields : {}),
        statusHistory: history(order.status, alertNote(outcome.reason, payment, order)),
        updatedAt: now,
      }
    }
  }
}

export async function handlePaymentNotification(
  paymentId: string,
  now = new Date(),
): Promise<'processed' | 'ignored'> {
  if (!/^\d{1,20}$/.test(paymentId)) return 'ignored'
  // A API do MP é a fonte da verdade; erro aqui vira 500 e o MP reenvia.
  const payment = await getPayment(paymentId)
  const orderId = payment.externalReference
  if (!orderId || !ORDER_ID.test(orderId)) {
    console.warn('webhook MP: pagamento sem pedido', { paymentId })
    return 'ignored'
  }

  const result = await db().runTransaction(async (tx) => {
    const order = (await tx.get(ordersCollection().doc(orderId))).data()
    if (!order) return null
    const outcome = decidePaymentOutcome(
      {
        status: order.status,
        totalCents: order.totals.totalCents,
        payment: order.payment,
        handledPaymentIds: order.statusHistory.flatMap((entry) =>
          entry.paymentId ? [entry.paymentId] : [],
        ),
      },
      payment,
    )
    const couponRef =
      outcome.kind === 'transition' && outcome.to === 'paid' && order.coupon
        ? db().doc(`coupons/${order.coupon.code}`)
        : null
    const couponExists = couponRef ? (await tx.get(couponRef)).exists : false

    const updates = paymentUpdates(order, payment, outcome, now)
    if (updates) tx.update(db().doc(`orders/${orderId}`), updates)
    if (couponRef && couponExists) tx.update(couponRef, { usedCount: FieldValue.increment(1) })
    return { order, outcome }
  })

  if (!result) {
    console.warn('webhook MP: pedido não encontrado', { orderId, paymentId })
    return 'ignored'
  }
  const { order, outcome } = result
  console.info('webhook MP', { orderId, paymentId, paymentStatus: payment.status, outcome })

  if (outcome.kind === 'alert') {
    await sendAdminAlert(order.number, alertNote(outcome.reason, payment, order))
  }
  await sendPaidOrderEmails(orderId, now)
  return outcome.kind === 'ignore' ? 'ignored' : 'processed'
}
```

Run: `make test-emulator` → Expected: PASS.

- [ ] **Step 3: Route Handler (teste primeiro)**

`src/app/api/webhooks/mercadopago/route.test.ts`:

```ts
import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlePaymentNotification = vi.hoisted(() => vi.fn())
vi.mock('@/server/orders/payment-notification', () => ({ handlePaymentNotification }))
vi.mock('@/server/env', () => ({ serverEnv: () => ({ MERCADOPAGO_WEBHOOK_SECRET: 'segredo' }) }))

import { POST } from './route'

function request({
  dataId = '9001',
  type = 'payment',
  secret = 'segredo',
}: { dataId?: string; type?: string; secret?: string } = {}) {
  const ts = '1700000000'
  const v1 = createHmac('sha256', secret)
    .update(`id:${dataId};request-id:req-1;ts:${ts};`)
    .digest('hex')
  return new Request(
    `https://loja.test/api/webhooks/mercadopago?data.id=${dataId}&type=${type}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-signature': `ts=${ts},v1=${v1}`,
        'x-request-id': 'req-1',
      },
      body: JSON.stringify({ type, data: { id: dataId } }),
    },
  )
}

beforeEach(() => {
  handlePaymentNotification.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/webhooks/mercadopago', () => {
  it('assinatura inválida → 401 sem processar', async () => {
    const response = await POST(request({ secret: 'outro' }))
    expect(response.status).toBe(401)
    expect(handlePaymentNotification).not.toHaveBeenCalled()
  })

  it('evento que não é de pagamento → 200 sem processar', async () => {
    const response = await POST(request({ type: 'merchant_order' }))
    expect(response.status).toBe(200)
    expect(handlePaymentNotification).not.toHaveBeenCalled()
  })

  it('pagamento → processa pelo id e responde 200', async () => {
    handlePaymentNotification.mockResolvedValue('processed')
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(handlePaymentNotification).toHaveBeenCalledWith('9001')
  })

  it('erro temporário → 500 para o Mercado Pago reenviar', async () => {
    handlePaymentNotification.mockRejectedValue(new Error('firestore fora'))
    expect((await POST(request())).status).toBe(500)
  })
})
```

`src/app/api/webhooks/mercadopago/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { serverEnv } from '@/server/env'
import { verifyMercadoPagoSignature } from '@/server/integrations/mercadopago-signature'
import { handlePaymentNotification } from '@/server/orders/payment-notification'

type Body = { type?: unknown; data?: { id?: unknown } } | null

export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = (await request.json().catch(() => null)) as Body
  const queryId = url.searchParams.get('data.id')

  const secret = serverEnv().MERCADOPAGO_WEBHOOK_SECRET
  const valid =
    !!secret &&
    verifyMercadoPagoSignature({
      signature: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId: queryId,
      secret,
    })
  if (!valid) {
    console.warn('webhook MP: assinatura inválida')
    return new NextResponse('unauthorized', { status: 401 })
  }

  const type = url.searchParams.get('type') ?? body?.type
  const bodyId = body?.data?.id
  const paymentId =
    queryId ?? (typeof bodyId === 'string' || typeof bodyId === 'number' ? String(bodyId) : null)
  if (type !== 'payment' || !paymentId) return new NextResponse('ignored')

  try {
    await handlePaymentNotification(paymentId)
    return new NextResponse('ok')
  } catch (error) {
    console.error('webhook MP: erro ao processar', { paymentId, error })
    return new NextResponse('error', { status: 500 })
  }
}
```

Run: `npm test -- src/app/api/webhooks` → Expected: PASS.

- [ ] **Step 4: Commit**

```bash
npm run typecheck && npm run lint
git add src/server/orders/order-emails.ts src/server/orders/payment-notification.ts src/app/api/webhooks tests/integration/payment-notification.test.ts
git commit -m "feat(payment): add idempotent mercado pago webhook with order emails"
```

---

### Task 11: Página do pedido e "pagar agora"

**Files:**
- Create: `src/features/orders/actions.ts`, `src/features/orders/order-summary.tsx`, `src/features/orders/order-view.tsx`, `src/features/orders/pending-payment-watcher.tsx`, `src/features/orders/retry-payment-button.tsx`, `src/features/orders/order-view.test.tsx`, `src/app/(loja)/pedido/[token]/page.tsx`

**Interfaces:**
- Consumes: `getOrderByToken`, `isPayable` (Task 8), `paymentRedirectUrl` (Task 8), `redirectTo`, `ORDER_STATUS_LABELS`, `rateLimit`, `clientIp`, `getCachedStoreSettings`, `whatsappUrl`.
- Produces:
  - Server Action `retryPaymentAction(token: string): Promise<Result<{ redirectUrl: string }>>`
  - `type SummaryItem = { productId: string; name: string; image: string; size: string; color: string | null; qty: number; lineTotalCents: number }`
  - `OrderSummary({ items, subtotalCents, discountCents, couponCode, shippingCents, loading })` — `shippingCents: number | null` (null = frete ainda não escolhido)
  - `type OrderViewData = Pick<Order, 'number' | 'status' | 'items' | 'totals' | 'shipping' | 'shippingAddress' | 'tracking' | 'coupon'>`
  - `OrderView({ order, token, payable, helpUrl })`, `PendingPaymentWatcher()`, `RetryPaymentButton({ token })`

- [ ] **Step 1: Escrever os testes**

`src/features/orders/order-view.test.tsx`:

```tsx
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const retryPaymentAction = vi.hoisted(() => vi.fn())
const redirectTo = vi.hoisted(() => vi.fn())
const refresh = vi.hoisted(() => vi.fn())
vi.mock('./actions', () => ({ retryPaymentAction }))
vi.mock('@/lib/navigate', () => ({ redirectTo }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

import { OrderView, type OrderViewData } from './order-view'

const order: OrderViewData = {
  number: 'SS-1001',
  status: 'pending_payment',
  items: [
    {
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
  ],
  totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
  shipping: {
    serviceId: 1,
    name: 'PAC',
    company: 'Correios',
    priceCents: 2500,
    deliveryDays: 8,
    productionDays: 10,
  },
  shippingAddress: {
    cep: '20040002',
    street: 'Rua da Assembleia',
    number: '10',
    complement: '',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
  tracking: null,
  coupon: null,
}

beforeEach(() => vi.resetAllMocks())
afterEach(() => vi.useRealTimers())

describe('OrderView', () => {
  it('pendente: "Pagar agora" gera um link novo e vai para o Mercado Pago', async () => {
    retryPaymentAction.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test/2' } })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} />)
    expect(screen.getByRole('heading', { name: 'Aguardando pagamento' })).toBeInTheDocument()
    expect(screen.getByText(/R\$\s324,80/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('https://mp.test/2'))
    expect(retryPaymentAction).toHaveBeenCalledWith('o1.mac')
  })

  it('erro ao gerar o link aparece na tela', async () => {
    retryPaymentAction.mockResolvedValue({ ok: false, code: 'x', message: 'Tente mais tarde.' })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Tente mais tarde.')
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('pendente fora do prazo: sem botão, com orientação', () => {
    render(<OrderView order={order} token="o1.mac" payable={false} helpUrl="https://wa.me/55" />)
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Prazo de pagamento encerrado' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/55',
    )
  })

  it('enviado: mostra o rastreio', () => {
    render(
      <OrderView
        order={{
          ...order,
          status: 'shipped',
          tracking: { carrier: 'Correios', code: 'AA123456789BR', url: 'https://rastreio.test/AA' },
        }}
        token="o1.mac"
        payable={false}
        helpUrl={null}
      />,
    )
    expect(screen.getByText('AA123456789BR')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rastrear entrega' })).toHaveAttribute(
      'href',
      'https://rastreio.test/AA',
    )
  })

  it('atualiza a página enquanto aguarda o pagamento', () => {
    vi.useFakeTimers()
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(refresh).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(11 * 60 * 1000))
    expect(refresh.mock.calls.length).toBeLessThan(125)
  })
})
```

Run: `npm test -- src/features/orders` → Expected: FAIL.

- [ ] **Step 2: Implementar componentes e action**

`src/features/orders/actions.ts`:

```ts
'use server'

import { fail, ok, type Result } from '@/lib/result'
import { getOrderByToken, isPayable } from '@/server/orders/access'
import { paymentRedirectUrl } from '@/server/orders/payment'
import { clientIp, rateLimit } from '@/server/ratelimit'

export async function retryPaymentAction(token: string): Promise<Result<{ redirectUrl: string }>> {
  if (!(await rateLimit(`retry-payment:${await clientIp()}`, { limit: 10, windowSec: 60 }))) {
    return fail('rate_limited', 'Muitas tentativas. Aguarde um instante e tente de novo.')
  }
  const order = await getOrderByToken(String(token))
  if (!order) return fail('not_found', 'Pedido não encontrado.')
  if (!isPayable(order)) return fail('not_payable', 'Este pedido não pode mais ser pago.')
  try {
    return ok({ redirectUrl: await paymentRedirectUrl(order) })
  } catch (error) {
    console.error('retryPayment: falha ao criar a preferência', { orderId: order.id, error })
    return fail('payment_unavailable', 'Não foi possível abrir o pagamento agora. Tente de novo.')
  }
}
```

`src/features/orders/order-summary.tsx`:

```tsx
import Image from 'next/image'
import { Spinner } from '@/components/ui'
import { formatBRL } from '@/lib/money'

export type SummaryItem = {
  productId: string
  name: string
  image: string
  size: string
  color: string | null
  qty: number
  lineTotalCents: number
}

export function OrderSummary({
  items,
  subtotalCents,
  discountCents,
  couponCode = null,
  shippingCents,
  loading = false,
}: {
  items: SummaryItem[]
  subtotalCents: number
  discountCents: number
  couponCode?: string | null
  /** null = frete ainda não escolhido. */
  shippingCents: number | null
  loading?: boolean
}) {
  const total = subtotalCents - discountCents + (shippingCents ?? 0)
  return (
    <section aria-label="Resumo do pedido" className="flex flex-col gap-5 border border-line p-6">
      <h2 className="text-sm font-black tracking-widest uppercase italic">Resumo</h2>
      {loading ? (
        <div className="flex justify-center text-muted">
          <Spinner size="sm" />
        </div>
      ) : null}
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={`${item.productId}|${item.size}|${item.color ?? ''}`} className="flex gap-3">
            <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-surface">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="flex flex-1 justify-between gap-2 text-xs">
              <div>
                <p className="font-bold tracking-widest uppercase">{item.name}</p>
                <p className="text-[10px] text-muted uppercase">
                  Tam. {item.size}
                  {item.color ? ` · ${item.color}` : ''} · Qtd. {item.qty}
                </p>
              </div>
              <p className="font-bold">{formatBRL(item.lineTotalCents)}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2 border-t border-line pt-4 text-xs tracking-widest uppercase">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatBRL(subtotalCents)}</dd>
        </div>
        {discountCents > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted">{couponCode ? `Cupom ${couponCode}` : 'Desconto'}</dt>
            <dd>{`− ${formatBRL(discountCents)}`}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted">Frete</dt>
          <dd>{shippingCents === null ? 'A calcular' : formatBRL(shippingCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-sm font-bold">
          <dt>Total</dt>
          <dd>{formatBRL(total)}</dd>
        </div>
      </dl>
    </section>
  )
}
```

`src/features/orders/pending-payment-watcher.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const INTERVAL_MS = 5000
const MAX_MS = 10 * 60 * 1000

/** Enquanto o pagamento não confirma, relê a página no servidor a cada 5 s (por até 10 min). */
export function PendingPaymentWatcher() {
  const router = useRouter()
  useEffect(() => {
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      if (Date.now() - startedAt > MAX_MS) {
        window.clearInterval(id)
        return
      }
      router.refresh()
    }, INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [router])
  return null
}
```

`src/features/orders/retry-payment-button.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui'
import { redirectTo } from '@/lib/navigate'
import { retryPaymentAction } from './actions'

export function RetryPaymentButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function pay() {
    startTransition(async () => {
      try {
        const result = await retryPaymentAction(token)
        if (result.ok) {
          redirectTo(result.data.redirectUrl)
          return
        }
        setError(result.message)
      } catch {
        setError('Não foi possível abrir o pagamento agora. Tente de novo.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" loading={pending} onClick={pay}>
        Pagar agora
      </Button>
      {error ? (
        <p role="alert" className="font-mono text-[10px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
```

`src/features/orders/order-view.tsx`:

```tsx
import Link from 'next/link'
import { formatCep } from '@/lib/cep'
import { ORDER_STATUS_LABELS } from '@/lib/order-status'
import type { Order } from '@/server/db/orders'
import { OrderSummary } from './order-summary'
import { PendingPaymentWatcher } from './pending-payment-watcher'
import { RetryPaymentButton } from './retry-payment-button'

export type OrderViewData = Pick<
  Order,
  'number' | 'status' | 'items' | 'totals' | 'shipping' | 'shippingAddress' | 'tracking' | 'coupon'
>

function statusMessage(order: OrderViewData, payable: boolean): string {
  const days = order.shipping.productionDays + order.shipping.deliveryDays
  switch (order.status) {
    case 'pending_payment':
      return payable
        ? 'Assim que o Mercado Pago confirmar o pagamento, esta página atualiza sozinha. Se você saiu antes de pagar, use o botão abaixo.'
        : 'O prazo de 48 horas para pagar este pedido acabou. Se você já pagou, fale com a gente.'
    case 'expired':
      return 'O prazo de 48 horas para pagar este pedido acabou. Se você já pagou, fale com a gente.'
    case 'paid':
      return `Pagamento confirmado! Seu pedido entra em produção em breve. Prazo estimado: até ${days} dias úteis.`
    case 'in_production':
      return `Seu pedido está sendo produzido. Prazo estimado: até ${days} dias úteis desde a compra.`
    case 'shipped':
      return 'Seu pedido foi enviado. Acompanhe pelo código de rastreio.'
    case 'delivered':
      return 'Pedido entregue. Obrigado por vestir Street Stars!'
    case 'cancelled':
      return 'Este pedido foi cancelado.'
    case 'refunded':
      return 'O valor deste pedido foi estornado.'
  }
}

export function OrderView({
  order,
  token,
  payable,
  helpUrl,
}: {
  order: OrderViewData
  token: string
  payable: boolean
  helpUrl: string | null
}) {
  const awaitingPayment = order.status === 'pending_payment' && payable
  const title =
    order.status === 'pending_payment' && !payable
      ? ORDER_STATUS_LABELS.expired
      : ORDER_STATUS_LABELS[order.status]
  const address = order.shippingAddress

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
          Pedido {order.number}
        </p>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">{title}</h1>
        <p className="text-sm text-muted">{statusMessage(order, payable)}</p>
      </header>

      {awaitingPayment ? (
        <>
          <PendingPaymentWatcher />
          <RetryPaymentButton token={token} />
        </>
      ) : null}

      {order.tracking ? (
        <section className="flex flex-col gap-2 border border-line p-6 text-xs">
          <h2 className="font-black tracking-widest uppercase">Rastreio</h2>
          <p className="text-muted">{order.tracking.carrier}</p>
          <p className="font-mono text-sm">{order.tracking.code}</p>
          {order.tracking.url ? (
            <a
              href={order.tracking.url}
              target="_blank"
              rel="noreferrer"
              className="self-start underline hover:text-paper"
            >
              Rastrear entrega
            </a>
          ) : null}
        </section>
      ) : null}

      <OrderSummary
        items={order.items}
        subtotalCents={order.totals.subtotalCents}
        discountCents={order.totals.discountCents}
        couponCode={order.coupon?.code ?? null}
        shippingCents={order.totals.shippingCents}
      />

      <section className="flex flex-col gap-2 text-xs text-muted">
        <h2 className="font-black tracking-widest text-paper uppercase">Entrega</h2>
        <p>
          {address.street}, {address.number}
          {address.complement ? ` — ${address.complement}` : ''}
        </p>
        <p>
          {address.neighborhood} · {address.city}/{address.state} · CEP {formatCep(address.cep)}
        </p>
        <p>
          {order.shipping.name}
          {order.shipping.company ? ` (${order.shipping.company})` : ''}
        </p>
      </section>

      <div className="flex flex-wrap gap-6 text-[10px] tracking-widest uppercase">
        {helpUrl ? (
          <a href={helpUrl} target="_blank" rel="noreferrer" className="underline hover:text-paper">
            Dúvidas? Fale com a gente no WhatsApp
          </a>
        ) : null}
        <Link href="/#shop" className="text-muted hover:text-paper">
          Continuar comprando
        </Link>
      </div>
    </div>
  )
}
```

`src/app/(loja)/pedido/[token]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OrderView } from '@/features/orders/order-view'
import { whatsappUrl } from '@/lib/store-settings'
import { getCachedStoreSettings } from '@/server/catalog'
import { getOrderByToken, isPayable } from '@/server/orders/access'

// Sempre lido do servidor: o status muda com o webhook.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Seu pedido', robots: { index: false, follow: false } }

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const order = await getOrderByToken(token)
  if (!order) notFound()

  const settings = await getCachedStoreSettings()
  return (
    <div className="pt-28 pb-20">
      <OrderView
        order={order}
        token={token}
        payable={isPayable(order)}
        helpUrl={whatsappUrl(settings.whatsapp, `Olá! Tenho uma dúvida sobre o pedido ${order.number}.`)}
      />
    </div>
  )
}
```

Run: `npm test -- src/features/orders` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint
git add src/features/orders "src/app/(loja)/pedido"
git commit -m "feat(orders): add order status page with payment retry and auto refresh"
```

---

### Task 12: Página de checkout

**Files:**
- Create: `src/features/checkout/actions.ts`, `src/features/checkout/actions.test.ts`, `src/features/checkout/checkout-form.tsx`, `src/features/checkout/checkout-form.test.tsx`, `src/app/(loja)/checkout/page.tsx`
- Modify: `src/features/cart/cart-context.tsx`

**Interfaces:**
- Consumes: `loadCheckoutCart`, `shippingOptionsFor`, `createOrder` (Task 8), `getCouponRule`, `applyCoupon`, `normalizeCouponCode`, `AppliedCoupon` (Tasks 3–4), `lookupCep`, `CepAddress` (Task 5), `priceCartAction`, `PricedCart`, `useCart`, `OrderSummary` (Task 11), `redirectTo`, `getSessionUser`, `getUser`, schemas de `@/lib/checkout`.
- Produces:
  - `useCart().clear(): void`
  - Server Actions: `lookupCepAction(rawCep: unknown): Promise<Result<CepAddress>>`, `quoteShippingAction(rawCep: unknown, rawLines: unknown): Promise<Result<ShippingOption[]>>`, `previewCouponAction(rawCode: unknown, rawLines: unknown): Promise<Result<AppliedCoupon>>`, `createOrderAction(input: unknown): Promise<Result<{ redirectUrl: string }>>`
  - `type CheckoutDefaults = { email: string; name: string; phone: string; cpf: string }`, `CheckoutForm({ defaults })`

- [ ] **Step 1: `clear()` no carrinho**

Em `src/features/cart/cart-context.tsx`:
- No tipo `CartContextValue`, depois de `removeKeys: (keys: string[]) => void`, acrescentar `clear: () => void`.
- Depois do `removeKeys` com `useCallback`, acrescentar:

```tsx
  const clear = useCallback(() => {
    update(() => [])
  }, [])
```

- No `useMemo` do `value`, acrescentar `clear,` depois de `removeKeys,` e `clear` na lista de dependências.

- [ ] **Step 2: Server Actions (teste primeiro)**

`src/features/checkout/actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimit = vi.hoisted(() => vi.fn())
const createOrder = vi.hoisted(() => vi.fn())
const getSessionUser = vi.hoisted(() => vi.fn())
vi.mock('@/server/ratelimit', () => ({ rateLimit, clientIp: async () => '1.2.3.4' }))
vi.mock('@/server/checkout/create-order', () => ({ createOrder }))
vi.mock('@/server/auth/session', () => ({ getSessionUser }))

import { createOrderAction, lookupCepAction } from './actions'

beforeEach(() => {
  vi.resetAllMocks()
  rateLimit.mockResolvedValue(true)
  createOrder.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test' } })
})

describe('createOrderAction', () => {
  it('limita por IP antes de qualquer trabalho', async () => {
    rateLimit.mockResolvedValueOnce(false)
    expect(await createOrderAction({})).toMatchObject({ ok: false, code: 'rate_limited' })
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('limita também por e-mail (normalizado)', async () => {
    rateLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const result = await createOrderAction({ customer: { email: ' Ana@Exemplo.com ' } })
    expect(result).toMatchObject({ ok: false, code: 'rate_limited' })
    expect(rateLimit.mock.calls[1]?.[0]).toBe('order-email:ana@exemplo.com')
  })

  it('passa o uid da sessão para o pedido', async () => {
    getSessionUser.mockResolvedValue({ uid: 'u1' })
    await createOrderAction({ customer: { email: 'a@b.com' } })
    expect(createOrder).toHaveBeenCalledWith(
      { customer: { email: 'a@b.com' } },
      { uid: 'u1', now: expect.any(Date) },
    )
  })
})

describe('lookupCepAction', () => {
  it('recusa CEP malformado sem chamar o ViaCEP', async () => {
    expect(await lookupCepAction('123')).toMatchObject({ ok: false, code: 'invalid_cep' })
  })
})
```

`src/features/checkout/actions.ts`:

```ts
'use server'

import type { ShippingOption } from '@/lib/checkout'
import { isValidCep, normalizeCep } from '@/lib/cep'
import { fail, ok, type Result } from '@/lib/result'
import { getSessionUser } from '@/server/auth/session'
import { loadCheckoutCart } from '@/server/checkout/cart'
import { createOrder } from '@/server/checkout/create-order'
import { shippingOptionsFor } from '@/server/checkout/shipping'
import { getCouponRule } from '@/server/db/coupons'
import { applyCoupon, type AppliedCoupon } from '@/server/domain/coupons'
import { lookupCep, type CepAddress } from '@/server/integrations/viacep'
import { clientIp, rateLimit, type RateLimitRule } from '@/server/ratelimit'

const LIMITED = fail('rate_limited', 'Muitas tentativas. Aguarde um instante e tente de novo.')
const CART_EMPTY = fail('cart_empty', 'Sua sacola está vazia.')

async function allowed(scope: string, rule: RateLimitRule): Promise<boolean> {
  return rateLimit(`${scope}:${await clientIp()}`, rule)
}

function cepFrom(raw: unknown): string | null {
  const cep = normalizeCep(String(raw ?? ''))
  return isValidCep(cep) ? cep : null
}

export async function lookupCepAction(rawCep: unknown): Promise<Result<CepAddress>> {
  const cep = cepFrom(rawCep)
  if (!cep) return fail('invalid_cep', 'CEP inválido.')
  if (!(await allowed('cep', { limit: 30, windowSec: 60 }))) return LIMITED
  try {
    const address = await lookupCep(cep)
    return address ? ok(address) : fail('cep_not_found', 'CEP não encontrado.')
  } catch (error) {
    console.error('lookupCep: falha no ViaCEP', { cep, error })
    return fail('cep_unavailable', 'Não conseguimos buscar o CEP. Preencha o endereço manualmente.')
  }
}

export async function quoteShippingAction(
  rawCep: unknown,
  rawLines: unknown,
): Promise<Result<ShippingOption[]>> {
  const cep = cepFrom(rawCep)
  if (!cep) return fail('invalid_cep', 'CEP inválido.')
  if (!(await allowed('shipping', { limit: 30, windowSec: 60 }))) return LIMITED
  const cart = await loadCheckoutCart(rawLines)
  if (cart.priced.lines.length === 0) return CART_EMPTY
  return shippingOptionsFor(cep, cart)
}

export async function previewCouponAction(
  rawCode: unknown,
  rawLines: unknown,
): Promise<Result<AppliedCoupon>> {
  if (!(await allowed('coupon', { limit: 20, windowSec: 60 }))) return LIMITED
  const cart = await loadCheckoutCart(rawLines)
  if (cart.priced.lines.length === 0) return CART_EMPTY
  const coupon = await getCouponRule(String(rawCode ?? ''))
  return applyCoupon(coupon, cart.priced.subtotalCents, new Date())
}

export async function createOrderAction(input: unknown): Promise<Result<{ redirectUrl: string }>> {
  if (!(await allowed('order', { limit: 10, windowSec: 60 }))) return LIMITED
  const email = (input as { customer?: { email?: unknown } } | null)?.customer?.email
  if (typeof email === 'string') {
    const key = `order-email:${email.trim().toLowerCase()}`
    if (!(await rateLimit(key, { limit: 5, windowSec: 600 }))) return LIMITED
  }
  const user = await getSessionUser()
  return createOrder(input, { uid: user?.uid ?? null, now: new Date() })
}
```

Run: `npm test -- src/features/checkout/actions.test.ts` → Expected: PASS (escrever o teste, ver falhar, implementar).

- [ ] **Step 3: Teste do formulário**

`src/features/checkout/checkout-form.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  lookupCepAction: vi.fn(),
  quoteShippingAction: vi.fn(),
  previewCouponAction: vi.fn(),
  createOrderAction: vi.fn(),
}))
const priceCartAction = vi.hoisted(() => vi.fn())
const redirectTo = vi.hoisted(() => vi.fn())
vi.mock('./actions', () => actions)
vi.mock('@/features/cart/actions', () => ({ priceCartAction }))
vi.mock('@/lib/navigate', () => ({ redirectTo }))

import { CartProvider } from '@/features/cart/cart-context'
import { CART_STORAGE_KEY } from '@/lib/cart'
import { CheckoutForm } from './checkout-form'

const line = { productId: 'p1', size: 'M', color: 'Preto', qty: 2 }
const priced = {
  lines: [
    {
      key: 'p1|M|Preto',
      productId: 'p1',
      slug: 'camiseta',
      name: 'Camiseta',
      image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
      size: 'M',
      color: 'Preto',
      unitPriceCents: 14990,
      qty: 2,
      lineTotalCents: 29980,
    },
  ],
  removedKeys: [],
  subtotalCents: 29980,
}
const options = [
  { serviceId: 1, name: 'PAC', company: 'Correios', priceCents: 2500, deliveryDays: 8, productionDays: 10, totalDays: 18 },
  { serviceId: 2, name: 'SEDEX', company: 'Correios', priceCents: 4000, deliveryDays: 3, productionDays: 10, totalDays: 13 },
]
const defaults = { email: 'ana@exemplo.com', name: 'Ana Souza', phone: '11987654321', cpf: '52998224725' }

function renderCheckout(cart: unknown[] = [line]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  return render(
    <CartProvider>
      <CheckoutForm defaults={defaults} />
    </CartProvider>,
  )
}

async function fillAddress() {
  const user = userEvent.setup()
  await screen.findByText('Camiseta')
  await user.type(screen.getByLabelText('CEP'), '01001000')
  await screen.findByRole('radio', { name: /SEDEX/ })
  await user.type(screen.getByLabelText('Número'), '100')
  return user
}

const payButton = () => screen.getByRole('button', { name: 'Ir para o pagamento' })

beforeEach(() => {
  localStorage.clear()
  vi.resetAllMocks()
  priceCartAction.mockResolvedValue(priced)
  actions.lookupCepAction.mockResolvedValue({
    ok: true,
    data: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' },
  })
  actions.quoteShippingAction.mockResolvedValue({ ok: true, data: options })
})

describe('checkout', () => {
  it('sacola vazia não mostra o formulário', () => {
    renderCheckout([])
    expect(screen.getByText('Sua sacola está vazia.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ir para o pagamento' })).not.toBeInTheDocument()
  })

  it('pré-preenche o contato de quem está logado', async () => {
    renderCheckout()
    expect(screen.getByLabelText('E-mail')).toHaveValue('ana@exemplo.com')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(11) 98765-4321')
    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
  })

  it('o CEP preenche o endereço e mostra o frete com o prazo total', async () => {
    renderCheckout()
    await fillAddress()
    expect(actions.lookupCepAction).toHaveBeenCalledWith('01001000')
    expect(actions.quoteShippingAction).toHaveBeenCalledWith('01001000', [line])
    expect(screen.getByLabelText('Rua')).toHaveValue('Praça da Sé')
    expect(screen.getByLabelText('UF')).toHaveValue('SP')
    expect(screen.getByRole('radio', { name: /PAC/ })).toHaveAccessibleName(/até 18 dias úteis/i)
  })

  it('cria o pedido, limpa a sacola e vai para o pagamento', async () => {
    actions.createOrderAction.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test/init' } })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.click(payButton())

    await waitFor(() => expect(redirectTo).toHaveBeenCalledWith('https://mp.test/init'))
    expect(actions.createOrderAction).toHaveBeenCalledWith({
      idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
      lines: [line],
      customer: {
        email: 'ana@exemplo.com',
        name: 'Ana Souza',
        phone: '(11) 98765-4321',
        cpf: '529.982.247-25',
      },
      address: {
        cep: '01001-000',
        street: 'Praça da Sé',
        number: '100',
        complement: '',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
      },
      serviceId: 2,
      couponCode: null,
    })
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null')).toEqual([])
  })

  it('reenviar o mesmo pedido reaproveita a chave; mudar o frete gera outra', async () => {
    actions.createOrderAction.mockResolvedValue({
      ok: false,
      code: 'payment_unavailable',
      message: 'Não foi possível abrir o pagamento.',
    })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))

    await user.click(payButton())
    expect(await screen.findByText('Não foi possível abrir o pagamento.')).toBeInTheDocument()
    await waitFor(() => expect(payButton()).toBeEnabled())
    await user.click(payButton())
    await waitFor(() => expect(actions.createOrderAction).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(payButton()).toBeEnabled())
    await user.click(screen.getByRole('radio', { name: /PAC/ }))
    await user.click(payButton())
    await waitFor(() => expect(actions.createOrderAction).toHaveBeenCalledTimes(3))

    const keys = actions.createOrderAction.mock.calls.map(([input]) => input.idempotencyKey)
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[0])
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('não envia com CPF inválido e mostra o erro no campo', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /PAC/ }))
    await user.clear(screen.getByLabelText('CPF'))
    await user.type(screen.getByLabelText('CPF'), '11111111111')
    await user.click(payButton())
    expect(await screen.findByText('CPF inválido')).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('exige escolher o frete', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(payButton())
    expect(await screen.findByText('Escolha uma opção de frete.')).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('cupom inválido mostra o motivo; válido entra no resumo', async () => {
    actions.previewCouponAction
      .mockResolvedValueOnce({ ok: false, code: 'coupon_expired', message: 'Este cupom expirou.' })
      .mockResolvedValueOnce({
        ok: true,
        data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
      })
    renderCheckout()
    const user = userEvent.setup()
    await screen.findByText('Camiseta')

    await user.type(screen.getByLabelText('Cupom'), 'velho')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText('Este cupom expirou.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Cupom'))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByText(/^− R\$\s29,98$/)).toBeInTheDocument()
    expect(actions.previewCouponAction).toHaveBeenLastCalledWith('bemvindo', [line])
  })
})
```

Run: `npm test -- src/features/checkout` → Expected: FAIL (`./checkout-form` não existe).

- [ ] **Step 4: Implementar o formulário e a página**

`src/features/checkout/checkout-form.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Button, Field, Input, Spinner } from '@/components/ui'
import { priceCartAction } from '@/features/cart/actions'
import { useCart } from '@/features/cart/cart-context'
import { OrderSummary } from '@/features/orders/order-summary'
import { formatCep, normalizeCep } from '@/lib/cep'
import { checkoutAddressSchema, checkoutCustomerSchema, type ShippingOption } from '@/lib/checkout'
import { formatCpf } from '@/lib/cpf'
import { formatBRL } from '@/lib/money'
import { redirectTo } from '@/lib/navigate'
import { formatPhone } from '@/lib/phone'
import type { PricedCart } from '@/server/domain/cart-pricing'
import type { AppliedCoupon } from '@/server/domain/coupons'
import {
  createOrderAction,
  lookupCepAction,
  previewCouponAction,
  quoteShippingAction,
} from './actions'

export type CheckoutDefaults = { email: string; name: string; phone: string; cpf: string }

type Contact = CheckoutDefaults
type Address = {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}
type Errors = Partial<Record<keyof Contact | keyof Address, string>>
type Notices = { shipping?: string; coupon?: string; form?: string }

const EMPTY_ADDRESS: Address = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
}
const UNEXPECTED = 'Algo deu errado. Tente novamente.'

function validate(contact: Contact, address: Address): Errors {
  const errors: Errors = {}
  const results = [checkoutCustomerSchema.safeParse(contact), checkoutAddressSchema.safeParse(address)]
  for (const result of results) {
    if (result.success) continue
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !(key in errors)) errors[key as keyof Errors] = issue.message
    }
  }
  return errors
}

function TextField({
  label,
  error,
  onValue,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange'> & {
  label: string
  error?: string
  onValue: (value: string) => void
}) {
  return (
    <Field label={label} error={error}>
      {(control) => <Input {...props} {...control} onChange={(event) => onValue(event.target.value)} />}
    </Field>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-sm font-black tracking-widest uppercase italic">{title}</legend>
      {children}
    </fieldset>
  )
}

export function CheckoutForm({ defaults }: { defaults: CheckoutDefaults }) {
  const { lines, removeKeys, clear } = useCart()
  const [contact, setContact] = useState<Contact>(() => ({
    ...defaults,
    phone: formatPhone(defaults.phone),
    cpf: formatCpf(defaults.cpf),
  }))
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS)
  const [errors, setErrors] = useState<Errors>({})
  const [notices, setNotices] = useState<Notices>({})
  const [priced, setPriced] = useState<PricedCart | null>(null)
  const [cartVersion, setCartVersion] = useState(0)
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [loadingCart, startCart] = useTransition()
  const [quoting, startQuote] = useTransition()
  const [applying, startCoupon] = useTransition()
  const [submitting, startSubmit] = useTransition()
  const request = useRef(0)
  // Mesma tentativa (clique duplo, erro de rede) reaproveita a chave; pedido diferente ganha outra.
  const attempt = useRef<{ key: string; payload: string } | null>(null)

  const notify = (patch: Notices) => setNotices((current) => ({ ...current, ...patch }))

  // Preço sempre do servidor. Se a sacola muda, frete e cupom calculados antes não valem mais.
  useEffect(() => {
    if (lines.length === 0) return
    const id = ++request.current
    startCart(async () => {
      try {
        const result = await priceCartAction(lines)
        if (id !== request.current) return
        setPriced(result)
        setOptions(null)
        setServiceId(null)
        setCoupon(null)
        if (result.removedKeys.length > 0) {
          removeKeys(result.removedKeys)
          setNotices({ form: 'Alguns itens não estão mais disponíveis e foram removidos.' })
        }
      } catch {
        if (id === request.current) setNotices({ form: 'Não foi possível carregar a sacola.' })
      }
    })
  }, [lines, cartVersion, removeKeys])

  function quote(cep: string) {
    startQuote(async () => {
      try {
        const [found, quoted] = await Promise.all([
          lookupCepAction(cep),
          quoteShippingAction(cep, lines),
        ])
        if (found.ok) setAddress((current) => ({ ...current, ...found.data }))
        setErrors((current) => ({
          ...current,
          cep: found.ok || found.code === 'cep_unavailable' ? undefined : found.message,
        }))
        setOptions(quoted.ok ? quoted.data : null)
        setServiceId(quoted.ok && quoted.data.length === 1 ? (quoted.data[0]?.serviceId ?? null) : null)
        notify({ shipping: quoted.ok ? undefined : quoted.message })
      } catch {
        notify({ shipping: 'Frete indisponível no momento. Tente novamente.' })
      }
    })
  }

  function onCepChange(value: string) {
    setAddress((current) => ({ ...current, cep: formatCep(value) }))
    setOptions(null)
    setServiceId(null)
    const cep = normalizeCep(value)
    if (cep.length === 8) quote(cep)
  }

  function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    startCoupon(async () => {
      try {
        const result = await previewCouponAction(code, lines)
        setCoupon(result.ok ? result.data : null)
        notify({ coupon: result.ok ? undefined : result.message })
      } catch {
        notify({ coupon: UNEXPECTED })
      }
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate(contact, address)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify({ form: 'Confira os campos destacados.' })
      return
    }
    if (serviceId === null) {
      notify({ form: 'Escolha uma opção de frete.' })
      return
    }

    const order = { lines, customer: contact, address, serviceId, couponCode: coupon?.code ?? null }
    const payload = JSON.stringify(order)
    if (attempt.current?.payload !== payload) {
      attempt.current = { key: crypto.randomUUID(), payload }
    }
    const idempotencyKey = attempt.current.key
    notify({ form: undefined })

    startSubmit(async () => {
      try {
        const result = await createOrderAction({ ...order, idempotencyKey })
        if (result.ok) {
          setRedirecting(true)
          clear()
          redirectTo(result.data.redirectUrl)
          return
        }
        notify({ form: result.message })
        if (result.code === 'cart_changed') setCartVersion((version) => version + 1)
        if (result.code === 'shipping_changed') {
          setOptions(null)
          setServiceId(null)
        }
        if (result.code.startsWith('coupon_')) setCoupon(null)
      } catch {
        notify({ form: UNEXPECTED })
      }
    })
  }

  if (redirecting) {
    return (
      <p role="status" className="py-16 text-center text-xs tracking-widest text-muted uppercase">
        Abrindo o pagamento…
      </p>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-xs tracking-widest text-muted uppercase">Sua sacola está vazia.</p>
        <Link href="/#shop" className="text-xs tracking-widest uppercase underline">
          Ver produtos
        </Link>
      </div>
    )
  }

  const subtotal = priced?.subtotalCents ?? 0
  const discount = Math.min(coupon?.discountCents ?? 0, subtotal)
  const shipping = options?.find((option) => option.serviceId === serviceId) ?? null
  const cepComplete = normalizeCep(address.cep).length === 8
  const setField = (key: keyof Address) => (value: string) =>
    setAddress((current) => ({ ...current, [key]: value }))

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-12">
        <Section title="1. Contato">
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={contact.email}
            error={errors.email}
            onValue={(email) => setContact((current) => ({ ...current, email }))}
          />
          <TextField
            label="Nome completo"
            autoComplete="name"
            value={contact.name}
            error={errors.name}
            onValue={(name) => setContact((current) => ({ ...current, name }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Telefone"
              type="tel"
              autoComplete="tel-national"
              value={contact.phone}
              error={errors.phone}
              onValue={(phone) => setContact((current) => ({ ...current, phone: formatPhone(phone) }))}
            />
            <TextField
              label="CPF"
              inputMode="numeric"
              value={contact.cpf}
              error={errors.cpf}
              onValue={(cpf) => setContact((current) => ({ ...current, cpf: formatCpf(cpf) }))}
            />
          </div>
        </Section>

        <Section title="2. Entrega">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <TextField
              label="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              value={address.cep}
              error={errors.cep}
              onValue={onCepChange}
            />
            <TextField
              label="Rua"
              autoComplete="address-line1"
              value={address.street}
              error={errors.street}
              onValue={setField('street')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Número"
              value={address.number}
              error={errors.number}
              onValue={setField('number')}
            />
            <TextField
              label="Complemento"
              autoComplete="address-line2"
              value={address.complement}
              error={errors.complement}
              onValue={setField('complement')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
            <TextField
              label="Bairro"
              value={address.neighborhood}
              error={errors.neighborhood}
              onValue={setField('neighborhood')}
            />
            <TextField
              label="Cidade"
              autoComplete="address-level2"
              value={address.city}
              error={errors.city}
              onValue={setField('city')}
            />
            <TextField
              label="UF"
              maxLength={2}
              autoComplete="address-level1"
              value={address.state}
              error={errors.state}
              onValue={(state) => setField('state')(state.toUpperCase())}
            />
          </div>
        </Section>

        <Section title="3. Frete">
          {quoting ? <Spinner size="sm" /> : null}
          {notices.shipping ? (
            <p role="alert" className="font-mono text-[10px] text-danger">
              {notices.shipping}
            </p>
          ) : null}
          {options === null && !quoting ? (
            cepComplete ? (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => quote(normalizeCep(address.cep))}
              >
                Calcular frete
              </Button>
            ) : (
              <p className="text-xs text-muted">Informe o CEP para calcular o frete.</p>
            )
          ) : null}
          {options?.map((option) => (
            <label
              key={option.serviceId}
              className="flex cursor-pointer items-start gap-3 border border-line p-4 has-checked:border-paper"
            >
              <input
                type="radio"
                name="shipping"
                className="mt-1 accent-paper"
                checked={serviceId === option.serviceId}
                onChange={() => setServiceId(option.serviceId)}
              />
              <span className="flex flex-1 flex-col gap-1 text-xs">
                <span className="flex justify-between font-bold tracking-widest uppercase">
                  <span>
                    {option.name}
                    {option.company ? ` · ${option.company}` : ''}
                  </span>
                  <span>{formatBRL(option.priceCents)}</span>
                </span>
                <span className="text-muted">
                  Até {option.totalDays} dias úteis ({option.productionDays} de produção +{' '}
                  {option.deliveryDays} de entrega)
                </span>
              </span>
            </label>
          ))}
        </Section>

        <Section title="4. Cupom">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                label="Cupom"
                autoCapitalize="characters"
                value={couponInput}
                onValue={setCouponInput}
              />
            </div>
            <Button variant="secondary" loading={applying} onClick={applyCoupon}>
              Aplicar
            </Button>
          </div>
          {notices.coupon ? (
            <p role="alert" className="font-mono text-[10px] text-danger">
              {notices.coupon}
            </p>
          ) : null}
          {coupon ? (
            <p className="text-xs text-muted">
              Cupom {coupon.code} aplicado.{' '}
              <button type="button" className="underline hover:text-paper" onClick={() => setCoupon(null)}>
                Remover
              </button>
            </p>
          ) : null}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          items={priced?.lines ?? []}
          loading={loadingCart}
          subtotalCents={subtotal}
          discountCents={discount}
          couponCode={coupon?.code ?? null}
          shippingCents={shipping?.priceCents ?? null}
        />
        {notices.form ? (
          <p role="alert" className="border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            {notices.form}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={submitting} disabled={!priced}>
          Ir para o pagamento
        </Button>
        <p className="text-[10px] text-muted">
          Pagamento com Pix ou cartão no ambiente seguro do Mercado Pago.
        </p>
      </aside>
    </form>
  )
}
```

`src/app/(loja)/checkout/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { CheckoutForm, type CheckoutDefaults } from '@/features/checkout/checkout-form'
import { getSessionUser } from '@/server/auth/session'
import { getUser } from '@/server/db/users'

export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } }

export default async function CheckoutPage() {
  const session = await getSessionUser()
  const profile = session ? await getUser(session.uid) : null
  const defaults: CheckoutDefaults = {
    email: session?.email ?? '',
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    cpf: profile?.cpf ?? '',
  }

  return (
    <div className="pt-28 pb-20">
      <Container className="flex flex-col gap-10">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic md:text-4xl">
          Finalizar compra
        </h1>
        <CheckoutForm defaults={defaults} />
      </Container>
    </div>
  )
}
```

Run: `npm test -- src/features` → Expected: PASS (incluindo `cart.test.tsx`, que não pode quebrar com o `clear()`).

- [ ] **Step 5: Teste manual rápido**

Com os emuladores **ou** com o projeto de dev (`make dev`): abrir `/checkout` com um item na sacola. Sem `MELHORENVIO_TOKEN` e sem `originCep`, o bloco de frete mostra "Frete indisponível…". O resto da página precisa renderizar sem erro no console. **Não** testar pagamento real aqui. O fluxo com sandbox fica para a Task 15.

- [ ] **Step 6: Commit**

```bash
npm run typecheck && npm run lint
git add src/features/cart/cart-context.tsx src/features/checkout "src/app/(loja)/checkout"
git commit -m "feat(checkout): add single-page checkout with shipping quote and coupon preview"
```

---

### Task 13: Expiração automática de pedidos (cron)

**Files:**
- Create: `src/server/orders/expire-orders.ts`, `tests/integration/expire-orders.test.ts`, `src/app/api/cron/expirar-pedidos/route.ts`, `src/app/api/cron/expirar-pedidos/route.test.ts`, `vercel.json`

**Interfaces:**
- Consumes: `ordersCollection`, `canTransition`, `serverEnv().CRON_SECRET`.
- Produces: `expirePendingOrders(now?: Date): Promise<number>`, `GET /api/cron/expirar-pedidos` (Bearer `CRON_SECRET`) → `{ expired: number }`.

- [ ] **Step 1: Testes**

`tests/integration/expire-orders.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { getOrder, ordersCollection } from '@/server/db/orders'
import { expirePendingOrders } from '@/server/orders/expire-orders'
import { NOW, orderDoc } from './fixtures'
import { clearFirestore } from './helpers'

const HOUR = 60 * 60 * 1000

beforeEach(clearFirestore)

describe('expirePendingOrders', () => {
  it('expira só os pendentes vencidos e registra no histórico', async () => {
    const past = new Date(NOW.getTime() - HOUR)
    const future = new Date(NOW.getTime() + HOUR)
    await ordersCollection().doc('vencido').set(orderDoc({ expiresAt: past }))
    await ordersCollection().doc('no-prazo').set(orderDoc({ expiresAt: future }))
    await ordersCollection().doc('pago').set(orderDoc({ status: 'paid', expiresAt: past }))

    expect(await expirePendingOrders(NOW)).toBe(1)

    const expired = await getOrder('vencido')
    expect(expired?.status).toBe('expired')
    expect(expired?.statusHistory.at(-1)).toEqual({ status: 'expired', at: NOW, by: 'system' })
    expect((await getOrder('no-prazo'))?.status).toBe('pending_payment')
    expect((await getOrder('pago'))?.status).toBe('paid')

    expect(await expirePendingOrders(NOW)).toBe(0)
  })
})
```

`src/app/api/cron/expirar-pedidos/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const expirePendingOrders = vi.hoisted(() => vi.fn())
const env = vi.hoisted(() => ({ value: { CRON_SECRET: 'segredo-do-cron-123' } as Record<string, string | undefined> }))
vi.mock('@/server/orders/expire-orders', () => ({ expirePendingOrders }))
vi.mock('@/server/env', () => ({ serverEnv: () => env.value }))

import { GET } from './route'

const call = (authorization?: string) =>
  GET(
    new Request('https://loja.test/api/cron/expirar-pedidos', {
      headers: authorization ? { authorization } : {},
    }),
  )

beforeEach(() => {
  expirePendingOrders.mockReset()
  env.value = { CRON_SECRET: 'segredo-do-cron-123' }
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('GET /api/cron/expirar-pedidos', () => {
  it('sem o segredo certo → 401', async () => {
    expect((await call()).status).toBe(401)
    expect((await call('Bearer errado')).status).toBe(401)
    env.value = {}
    expect((await call('Bearer undefined')).status).toBe(401)
    expect(expirePendingOrders).not.toHaveBeenCalled()
  })

  it('com o segredo → expira e responde a contagem', async () => {
    expirePendingOrders.mockResolvedValue(3)
    const response = await call('Bearer segredo-do-cron-123')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ expired: 3 })
  })
})
```

Run: `npm test -- src/app/api/cron` e `make test-emulator` → Expected: FAIL.

- [ ] **Step 2: Implementar**

`src/server/orders/expire-orders.ts`:

```ts
import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '@/server/db/firebase-admin'
import { ordersCollection } from '@/server/db/orders'
import { canTransition } from '@/server/domain/order-status'

// ponytail: até 200 por execução diária; se a fila crescer, paginar até esvaziar.
const BATCH = 200

export async function expirePendingOrders(now = new Date()): Promise<number> {
  const due = await ordersCollection()
    .where('status', '==', 'pending_payment')
    .where('expiresAt', '<=', now)
    .limit(BATCH)
    .get()

  let expired = 0
  for (const doc of due.docs) {
    // Relê na transação: o webhook pode ter pago o pedido entre a consulta e a escrita.
    const changed = await db().runTransaction(async (tx) => {
      const order = (await tx.get(doc.ref)).data()
      if (order?.status !== 'pending_payment' || !canTransition(order.status, 'expired')) {
        return false
      }
      tx.update(db().doc(`orders/${doc.id}`), {
        status: 'expired',
        statusHistory: FieldValue.arrayUnion({ status: 'expired', at: now, by: 'system' }),
        updatedAt: now,
      })
      return true
    })
    if (changed) expired += 1
  }
  return expired
}
```

`src/app/api/cron/expirar-pedidos/route.ts`:

```ts
import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { serverEnv } from '@/server/env'
import { expirePendingOrders } from '@/server/orders/expire-orders'

const digest = (value: string) => createHash('sha256').update(value).digest()

// A Vercel Cron chama com "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET
  const given = request.headers.get('authorization') ?? ''
  if (!secret || !timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return new NextResponse('unauthorized', { status: 401 })
  }
  const expired = await expirePendingOrders()
  console.info('cron: pedidos expirados', { expired })
  return NextResponse.json({ expired })
}
```

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/expirar-pedidos", "schedule": "0 9 * * *" }]
}
```

(09:00 UTC = 06:00 em Brasília; o plano Hobby da Vercel permite cron diário.)

Run: `npm test -- src/app/api/cron` e `make test-emulator` → Expected: PASS.

- [ ] **Step 3: Commit**

```bash
npm run typecheck && npm run lint && npx prettier --check vercel.json
git add src/server/orders/expire-orders.ts src/app/api/cron tests/integration/expire-orders.test.ts vercel.json
git commit -m "feat(orders): expire unpaid orders daily via vercel cron"
```

---

### Task 14: Documentação e decisões na spec

**Files:**
- Modify: `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`, `README.md` (se listar variáveis ou comandos de deploy)

- [ ] **Step 1: Atualizar a spec com as decisões da fase**

Em `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`:
- Seção 1, tabela de decisões: trocar a linha `| Pagamento | Mercado Pago Checkout Pro (redirect). |` por `| Pagamento | Mercado Pago Checkout Pro (redirect), só Pix e cartão (sem boleto), até 6 parcelas. |` e acrescentar `| Frete | Correios PAC e SEDEX via Melhor Envio. |`.
- Seção 2, item **Compra sem conta**: trocar o texto por `o link /pedido/<orderId>.<hmac> é assinado com ORDER_TOKEN_SECRET (HMAC-SHA256) e comparado em tempo constante. Nada por pedido fica salvo, e o webhook consegue montar o link do e-mail. Trocar o segredo invalida os links já enviados.`
- Seção 3, `orders`: remover a linha `accessTokenHash` e, em `statusHistory`, trocar por `{ status, at, by: 'system' | 'webhook' | uid, note?, paymentId? }[]`. Em `notifications`, anotar `adminAlertSentAt = e-mail de "novo pedido pago" para a loja`.
- Seção 4, Checkout, item 1: acrescentar `(logado: pré-preenche e-mail, nome, telefone e CPF; escolher ou salvar endereços fica na Fase 4)`. No item 2, remover `Logado: escolhe um endereço salvo ou marca "salvar endereço".`
- Seção 4, `createOrder`, passo 8: trocar `e accessTokenHash` por `(o link de acesso é derivado do id)`.
- Seção 7, `emails/`: anotar `(templates HTML com escape automático; sem react-email)`.
- Seção 8, último item: trocar `e falha repetida no webhook` por `pagamento aprovado em pedido cancelado ou já pago. Falhas do webhook ficam nos logs da Vercel (o MP reenvia).`
- Seção 10: trocar `MP e Melhor Envio simulados com MSW` por `MP, Melhor Envio e Resend simulados com vi.mock (clientes testados à parte com fetch simulado)`. No item E2E, anotar `(adiado: Playwright entra junto com o admin)`.
- Seção 11: acrescentar `- **Variáveis:** as integrações (Mercado Pago, Melhor Envio, Resend, CRON_SECRET) são obrigatórias quando VERCEL_ENV=production. Preview e build local funcionam sem elas.`

- [ ] **Step 2: README**

```bash
grep -n -i "deploy\|variáve\|env" README.md
```

Se o README tiver uma seção de variáveis ou de deploy, acrescentar uma linha apontando para o `.env.example` e lembrar que é preciso publicar o índice de `orders(status, expiresAt)` com `npx firebase deploy --only firestore:indexes --project <projeto>`. Se não tiver, não criar seção nova.

- [ ] **Step 3: Verificar tudo**

```bash
make check
```

Expected: lint, formatação, tipos, testes unitários, emulador e build passando.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs README.md
git commit -m "docs: record phase 3 checkout and payment decisions in spec"
```

---

### Task 15: Revisão da fase e teste com sandbox

- [ ] **Step 1: Revisão contra a base da fase (skill `git-flow`, seção 5)**

```bash
git log --oneline 36ebace..HEAD
git diff --stat 36ebace..HEAD
make check
```

Montar o relatório no formato da skill. Pontos de atenção obrigatórios:
- **Riscos:** o webhook só funciona com URL pública (preview da Vercel ou túnel). Em localhost, o pedido fica pendente até "Pagar agora" ou até o cron.
- **Configuração externa pendente (usuário):**
  - Painel do Mercado Pago: cadastrar o webhook `https://<domínio>/api/webhooks/mercadopago` (evento "Pagamentos") e copiar o segredo para `MERCADOPAGO_WEBHOOK_SECRET`.
  - Preencher `settings/store.originCep` (o CEP de onde os pedidos saem).
  - Publicar o índice do Firestore.
  - Definir `CRON_SECRET` na Vercel.
- **Fora desta fase:** e-mail de "pedido enviado" (Fase 5, com o rastreio no admin), endereços salvos (Fase 4) e Playwright.

- [ ] **Step 2: Roteiro de teste manual com sandbox (só com o aval do usuário)**

Pré-requisitos que o usuário confirma: tokens de **teste** do Mercado Pago, token do Melhor Envio **sandbox**, `originCep` preenchido, e usuários de teste do Mercado Pago (comprador). Roteiro:
1. Adicionar dois produtos à sacola → `/checkout` → CEP → escolher PAC → aplicar cupom → "Ir para o pagamento".
2. No Mercado Pago (comprador de teste), pagar com cartão de teste aprovado (`APRO`).
3. Voltar para `/pedido/<token>` e ver "Pagamento confirmado" (com webhook acessível) ou "Aguardando pagamento" com refresh.
4. Repetir com cartão recusado (`OTHE`) e conferir que o pedido continua pendente e o "Pagar agora" funciona.

Não fazer push nem PR: perguntar ao usuário.
