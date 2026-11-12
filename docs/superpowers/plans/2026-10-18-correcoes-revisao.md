# Correções da revisão profunda: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o achado crítico, os 16 importantes e 4 menores baratos que a revisão em 6 camadas encontrou na `refactor/nextjs` antes do lançamento.

**Architecture:** Cada correção fica na camada que é dona do comportamento: regras puras em `src/server/domain` e `src/lib`, transações em `src/server/db`, telas em `src/features`. Toda correção começa por um teste que reproduz o problema e falha. A única mudança de modelo é a reserva de cupom: o uso passa a ser contado quando o pedido é criado e devolvido quando ele expira ou é cancelado sem pagamento.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, zod 4, firebase-admin 14, Vitest 5 + Testing Library + emulador do Firestore. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`

## Global Constraints

- Tudo das Fases 1 a 5 continua valendo:
  - TypeScript strict com `noUncheckedIndexedAccess`.
  - `server-only` em `src/server/**`.
  - Dinheiro em centavos.
  - Mensagens em português, sem detalhe interno.
  - `Result<T>` para erros esperados.
  - Conventional Commits em inglês, sem atribuição a IA e sem `git push`.
  - Firestore sem `undefined`, e leituras antes de escritas nas transações.
  - Lint sem `setState` síncrono em `useEffect` e sem `new Date()` no render.
- **Cupom (decisão do usuário, 2026-10-18):**
  - O uso é **reservado ao criar o pedido**, e o limite nunca é estourado por pedidos pendentes.
  - A reserva é devolvida quando o pedido expira, ou quando é cancelado ainda aguardando pagamento.
  - Pedido `expired` que é pago depois reserva de novo, mesmo acima do limite, porque o cliente já pagou; nesse caso a loja recebe um alerta.
  - Pedido pago que é cancelado ou estornado continua contando.
- **Valor mínimo do pedido:** R$ 1,00 (`MIN_ORDER_CENTS = 100`). O Mercado Pago não aceita item com valor zero.
- **Limites da sacola:** tamanho com até 20 caracteres e nome de cor com até 40. As constantes são compartilhadas entre `src/lib/cart.ts` e o formulário do admin.
- **WhatsApp:** gravado como `55` + DDD + número (12 ou 13 dígitos). Com 10 ou 11 dígitos, o `55` é acrescentado.
- **Ids aceitos nas actions do admin:** `/^[A-Za-z0-9_-]{1,128}$/`. As coleções migradas usam o slug como id.
- Testes de emulador: `make test-emulator`. Nesta máquina, antes de `make`: `export PATH="/c/Program Files/Microsoft/jdk-21.0.12.101-hotspot/bin:/c/Users/bento/AppData/Local/Microsoft/WinGet/Packages/ezwinports.make_Microsoft.Winget.Source_8wekyb3d8bbwe/bin:$PATH"`.
- No Windows, o Python em modo texto grava CRLF. Escrever arquivos com a ferramenta Write ou com `newline=''`, e rodar `npx prettier --write` nos arquivos tocados **antes** do `git add`. Não usar `| tail` depois de um comando cujo erro importa.
- O `npm run dev` do usuário pode estar rodando na porta 3000. Não apagar `.next/dev`. O build convive com o dev no Next 16.
- Branch: `refactor/nextjs`. Base: o commit deste plano.

## Review Focus

1. **Corrida entre dois pedidos com o último uso do cupom:** só um passa, porque a reserva está na mesma transação que cria o pedido, e o outro recebe "Este cupom esgotou". Testado na Task 3.
2. **Pedido expirado que é pago:** a reserva volta a contar, mesmo acima do limite, e a loja é avisada. Pedido expirado que ninguém paga nunca deixa o `usedCount` negativo, inclusive pedidos antigos criados antes da reserva existir. Testado na Task 3.
3. **Cliente que volta do Mercado Pago com Pix gerado ou cartão aprovado e o webhook ainda não chegou:** não aparece "Pagar agora"; aparece "pagamento em processamento" e a página atualiza sozinha. Pagamento recusado mostra o motivo e volta a oferecer o botão. Testado na Task 5.
4. **Respostas fora de ordem:** CEP corrigido rápido no checkout, CEP no catálogo de endereços e upload de várias fotos enquanto o admin edita. A resposta antiga nunca sobrescreve a mais nova, e nada que o usuário digitou some. Testado nas Tasks 6, 8 e 9.
5. **Rede caindo no meio de uma ação** (perfil, endereços, formulários do admin, ações do pedido): a mensagem aparece no próprio formulário, o que foi digitado continua lá e o layout não some. Testado na Task 12.

---

### Task 1: Ids com hífen nas actions do admin (crítico)

**Files:**
- Modify: `src/features/admin/catalog-actions.ts:13-14`, `src/features/admin/order-actions.ts:9-10`, `src/features/admin/catalog-actions.test.ts`

**Interfaces:**
- Produces: as duas constantes `isId` aceitam `/^[A-Za-z0-9_-]{1,128}$/`.

- [ ] **Step 1: Teste que reproduz**

Em `src/features/admin/catalog-actions.test.ts`, dentro de `describe('saveCollectionAction')`, acrescentar:

```ts
  it('aceita id com hífen (coleções migradas usam o slug como id) e recusa caminhos', async () => {
    const values = {
      ...collectionToForm(null),
      title: 'Every Star Is Unique',
      coverImage: 'https://res.cloudinary.com/x/image/upload/c.jpg',
    }
    await saveCollectionAction('every-star-is-unique', values)
    expect(collections.saveCollection).toHaveBeenCalledWith(
      'every-star-is-unique',
      expect.objectContaining({ title: 'Every Star Is Unique' }),
    )
    expect(await saveCollectionAction('../x', values)).toMatchObject({ code: 'invalid_input' })
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit src/features/admin/catalog-actions.test.ts`
Expected: FAIL (`saveCollection` não é chamado; a action devolve `invalid_input`)

- [ ] **Step 3: Corrigir**

Nos dois arquivos, trocar a regex por:

```ts
// Ids automáticos do Firestore e ids escolhidos (coleções migradas usam o slug); sem '/' nem '.'.
const isId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value)
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit src/features/admin`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/admin
git add src/features/admin/catalog-actions.ts src/features/admin/order-actions.ts src/features/admin/catalog-actions.test.ts
git commit -m "fix(admin): accept slug-like ids so migrated collections can be saved"
```

---

### Task 2: Variável vazia no `.env.local` não derruba o app

**Files:**
- Modify: `src/lib/env.ts:3-12`, `src/lib/env.test.ts`, `src/server/env.test.ts`, `scripts/doctor.sh:40`

**Interfaces:**
- Produces: `parseEnv` trata `''` como ausente antes de validar.

- [ ] **Step 1: Testes que reproduzem**

Em `src/server/env.test.ts`, acrescentar ao `describe('parseServerEnv')`:

```ts
  it('linha vazia no .env (UPSTASH_REDIS_REST_URL=) conta como ausente', () => {
    const env = parseServerEnv({
      ...emulator,
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
      CRON_SECRET: '',
      CLOUDINARY_API_KEY: '',
    })
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined()
    expect(env.CRON_SECRET).toBeUndefined()
  })
```

(`emulator` é o objeto de ambiente de emulador que já existe no topo do arquivo; se o nome for outro, use o equivalente.)

Em `src/lib/env.test.ts`, acrescentar:

```ts
  it('NEXT_PUBLIC opcional vazio conta como ausente', () => {
    const env = parseEnv(publicEnvSchema, {
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'k',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'd',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'p',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'a',
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: '',
    })
    expect(env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME).toBeUndefined()
  })
```

(ajustar o import para trazer `parseEnv` e `publicEnvSchema`).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit src/lib/env.test.ts src/server/env.test.ts`
Expected: FAIL ("Variáveis de ambiente inválidas ou ausentes")

- [ ] **Step 3: Corrigir**

Em `src/lib/env.ts`, no começo de `parseEnv`:

```ts
  // O Next lê `CHAVE=` como texto vazio; tratamos como ausente para não derrubar quem copiou o .env.example.
  const present = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  )
  const result = schema.safeParse(present)
```

(substituindo a linha `const result = schema.safeParse(source)`).

Em `scripts/doctor.sh`, trocar o regex dos opcionais por:

```bash
    elif [[ "$key" =~ ^(UPSTASH_|MERCADOPAGO_|MELHORENVIO_|RESEND_|EMAIL_FROM|CRON_SECRET|CLOUDINARY_|NEXT_PUBLIC_CLOUDINARY_) ]]; then
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit src/lib/env.test.ts src/server/env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/lib/env.ts src/lib/env.test.ts src/server/env.test.ts
git add src/lib/env.ts src/lib/env.test.ts src/server/env.test.ts scripts/doctor.sh
git commit -m "fix(env): treat empty env lines as unset"
```

---

### Task 3: Reserva de cupom

**Files:**
- Modify: `src/server/db/coupons.ts`, `src/server/checkout/create-order.ts`, `src/server/orders/expire-orders.ts`, `src/server/orders/payment-notification.ts`, `src/server/db/orders.ts` (`applyAdminTransition`), `tests/integration/create-order.test.ts`, `tests/integration/expire-orders.test.ts`, `tests/integration/payment-notification.test.ts`, `tests/integration/admin-orders.test.ts`

**Interfaces:**
- Produces, em `@/server/db/coupons`:
  - `readCouponUsage(tx: Transaction, code: string): Promise<{ ref: DocumentReference; usedCount: number; maxUses: number | null } | null>`, que lê dentro da transação. O cupom pode não existir mais.
  - `couponUsageWrite(usage: NonNullable<Awaited<ReturnType<typeof readCouponUsage>>>, delta: 1 | -1): { usedCount: number }`, que devolve o novo valor, nunca abaixo de 0.
- Regras:
  - **`createOrder`:** dentro da transação, antes de `nextOrderNumber`, relê o cupom. Se `maxUses !== null && usedCount >= maxUses`, devolve `fail('coupon_exhausted', 'Este cupom esgotou.')` sem criar o pedido. Senão, incrementa.
  - **`expirePendingOrders`:** ao expirar um pedido com cupom, devolve 1.
  - **`applyAdminTransition`:** com `pending_payment → cancelled` e cupom, devolve 1.
  - **Webhook:** `pending_payment → paid` não mexe mais no cupom. `expired → paid` incrementa 1; se ficar acima de `maxUses`, acrescenta ao histórico a nota `Cupom X passou do limite de usos (pedido pago depois de expirar).` e chama `sendAdminAlert`.

- [ ] **Step 1: Testes que reproduzem**

Em `tests/integration/create-order.test.ts`, acrescentar ao `describe('createOrder')`:

```ts
  it('reserva o uso do cupom ao criar e recusa o pedido seguinte quando esgota', async () => {
    await db()
      .doc('coupons/UNICO')
      .set({
        type: 'percent',
        value: 10,
        minSubtotalCents: null,
        startsAt: null,
        endsAt: null,
        maxUses: 1,
        usedCount: 0,
        active: true,
      })
    const first = await createOrder(input({ couponCode: 'UNICO' }), ctx)
    expect(first.ok).toBe(true)
    expect((await db().doc('coupons/UNICO').get()).get('usedCount')).toBe(1)

    const second = await createOrder(
      input({ couponCode: 'UNICO', idempotencyKey: '3a1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }),
      ctx,
    )
    expect(second).toMatchObject({ ok: false, code: 'coupon_exhausted' })
    expect(await allOrders()).toHaveLength(1)
  })

  it('dois pedidos simultâneos com o último uso: só um passa', async () => {
    await db()
      .doc('coupons/UNICO')
      .set({
        type: 'percent',
        value: 10,
        minSubtotalCents: null,
        startsAt: null,
        endsAt: null,
        maxUses: 1,
        usedCount: 0,
        active: true,
      })
    const results = await Promise.all([
      createOrder(input({ couponCode: 'UNICO' }), ctx),
      createOrder(
        input({ couponCode: 'UNICO', idempotencyKey: '4b1c8f3e-7c1a-4d6a-9a3b-1c2d3e4f5a6b' }),
        ctx,
      ),
    ])
    expect(results.filter((r) => r.ok)).toHaveLength(1)
    expect((await db().doc('coupons/UNICO').get()).get('usedCount')).toBe(1)
  })
```

Em `tests/integration/expire-orders.test.ts`, acrescentar:

```ts
  it('devolve a reserva do cupom e nunca deixa o contador negativo', async () => {
    const past = new Date(NOW.getTime() - HOUR)
    const coupon = { code: 'BEMVINDO', type: 'percent' as const, value: 10, discountCents: 0 }
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1 })
    await ordersCollection().doc('a').set(orderDoc({ expiresAt: past, coupon }))
    await ordersCollection()
      .doc('b')
      .set(orderDoc({ expiresAt: past, coupon, number: 'SS-1002' }))
    expect(await expirePendingOrders(NOW)).toBe(2)
    expect((await db().doc('coupons/BEMVINDO').get()).get('usedCount')).toBe(0)
  })
```

(importar `db` de `@/server/db/firebase-admin`).

Em `tests/integration/payment-notification.test.ts`:
- No teste `'aprovado com o valor certo: pago, cupom contado e e-mails enviados uma vez'`, trocar o nome para `'aprovado com o valor certo: pago e e-mails enviados uma vez; o cupom já foi reservado na criação'` e a expectativa do cupom para `expect(await couponUses()).toBe(0)`.
- Trocar o teste `'pedido expirado ainda vira pago'` por:

```ts
  it('pedido expirado ainda vira pago e volta a contar o cupom', async () => {
    await db().doc('orders/o1').update({ status: 'expired' })
    getPayment.mockResolvedValue(payment())
    await handlePaymentNotification('9001')
    expect((await getOrder('o1'))?.status).toBe('paid')
    expect(await couponUses()).toBe(1)
  })

  it('pago depois de expirar com o cupom esgotado: paga, registra e alerta a loja', async () => {
    await db().doc('orders/o1').update({ status: 'expired' })
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1, maxUses: 1 })
    getPayment.mockResolvedValue(payment())
    await handlePaymentNotification('9001')
    const order = await getOrder('o1')
    expect(order?.status).toBe('paid')
    expect(order?.statusHistory.some((e) => e.note?.includes('passou do limite'))).toBe(true)
    expect(sendEmail.mock.calls.some(([m]) => m.to === STORE_EMAIL && /Alerta/.test(m.subject))).toBe(
      true,
    )
  })
```

(Se o assunto do `adminAlertEmail` não contiver "Alerta", troque a regex pelo prefixo real em `src/emails/admin-alert.ts`.)

Em `tests/integration/admin-orders.test.ts`, acrescentar ao `describe('applyAdminTransition')`:

```ts
  it('cancelar pedido ainda pendente devolve a reserva do cupom', async () => {
    const coupon = { code: 'BEMVINDO', type: 'percent' as const, value: 10, discountCents: 0 }
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1 })
    await seed('a', { status: 'pending_payment', coupon })
    await applyAdminTransition('a', { to: 'cancelled', note: 'Teste' }, 'adm', LATER)
    expect((await db().doc('coupons/BEMVINDO').get()).get('usedCount')).toBe(0)
  })

  it('cancelar pedido pago mantém o uso', async () => {
    const coupon = { code: 'BEMVINDO', type: 'percent' as const, value: 10, discountCents: 0 }
    await db().doc('coupons/BEMVINDO').set({ usedCount: 1 })
    await seed('a', { status: 'paid', coupon })
    await applyAdminTransition('a', { to: 'cancelled', note: 'Teste' }, 'adm', LATER)
    expect((await db().doc('coupons/BEMVINDO').get()).get('usedCount')).toBe(1)
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `make test-emulator`
Expected: FAIL nos testes novos (o cupom não é reservado nem devolvido) e no teste do webhook alterado (ainda incrementa no pago).

- [ ] **Step 3: Helpers do cupom**

Em `src/server/db/coupons.ts`, acrescentar os imports `import type { DocumentReference, Transaction } from 'firebase-admin/firestore'` e:

```ts
export type CouponUsage = { ref: DocumentReference; usedCount: number; maxUses: number | null }

/** Lê o uso do cupom dentro da transação; null se o cupom foi apagado. */
export async function readCouponUsage(tx: Transaction, code: string): Promise<CouponUsage | null> {
  const ref = db().collection('coupons').doc(code)
  const snapshot = await tx.get(ref)
  if (!snapshot.exists) return null
  const usedCount = Number(snapshot.get('usedCount') ?? 0)
  const maxUses = snapshot.get('maxUses')
  return { ref, usedCount, maxUses: typeof maxUses === 'number' ? maxUses : null }
}

/** Reserva (+1) ou devolve (-1) um uso. Nunca abaixo de zero (pedidos antigos não reservaram). */
export function couponUsageWrite(usage: CouponUsage, delta: 1 | -1): { usedCount: number } {
  return { usedCount: Math.max(0, usage.usedCount + delta) }
}
```

- [ ] **Step 4: Reservar no `createOrder`**

Em `src/server/checkout/create-order.ts`:
- Importar `couponUsageWrite, readCouponUsage` de `@/server/db/coupons`.
- Trocar o tipo da transação para devolver `Result<Order>` e reservar antes de numerar:

```ts
  const created = await db().runTransaction(async (tx): Promise<Result<Order>> => {
    const duplicate = (await tx.get(idempotencyQuery(input.idempotencyKey))).docs[0]
    if (duplicate) return ok({ id: duplicate.id, ...duplicate.data() })

    // Reserva o uso aqui, na mesma transação do pedido: dois pedidos com o último uso não passam juntos.
    const usage = coupon ? await readCouponUsage(tx, coupon.code) : null
    if (usage && usage.maxUses !== null && usage.usedCount >= usage.maxUses) {
      return fail('coupon_exhausted', 'Este cupom esgotou.')
    }

    const number = await nextOrderNumber(tx)
    // ...(montagem do `doc` exatamente como hoje)...
    tx.create(ref, doc)
    if (usage) tx.update(usage.ref, couponUsageWrite(usage, 1))
    return ok({ id: ref.id, ...doc })
  })
  if (!created.ok) return created
  return redirectFor(created.data, ctx.now)
```

(`nextOrderNumber` continua sendo a última leitura. A leitura do cupom vem antes dela, como o comentário de `nextOrderNumber` exige.)

- [ ] **Step 5: Devolver na expiração**

Em `src/server/orders/expire-orders.ts`, dentro da transação, depois de ler `order` e antes de qualquer escrita:

```ts
      const usage = order.coupon ? await readCouponUsage(tx, order.coupon.code) : null
```

e, depois do `tx.update` do pedido:

```ts
      if (usage) tx.update(usage.ref, couponUsageWrite(usage, -1))
```

(importar de `@/server/db/coupons`).

- [ ] **Step 6: Devolver no cancelamento de pedido pendente**

Em `src/server/db/orders.ts`, `applyAdminTransition`: depois do `if (!adminTargets(...))` e antes do `tx.update`:

```ts
    // Cancelar antes do pagamento libera o uso reservado; pedido já pago continua contando.
    const releases = input.to === 'cancelled' && order.status === 'pending_payment' && order.coupon
    const usage = releases && order.coupon ? await readCouponUsage(tx, order.coupon.code) : null
```

e, depois do `tx.update(ref, ...)`, `if (usage) tx.update(usage.ref, couponUsageWrite(usage, -1))`. Importar de `./coupons`.

- [ ] **Step 7: Webhook só recontar para pedido expirado**

Em `src/server/orders/payment-notification.ts`, na transação:
- Trocar o bloco `couponRef`/`couponExists` por:

```ts
    // pending_payment já reservou o uso ao criar; expired devolveu, então pagar depois reserva de novo.
    const reReserve =
      outcome.kind === 'transition' &&
      outcome.to === 'paid' &&
      order.status === 'expired' &&
      order.coupon
    const usage = reReserve && order.coupon ? await readCouponUsage(tx, order.coupon.code) : null
    const overLimit = !!usage && usage.maxUses !== null && usage.usedCount >= usage.maxUses
```

- Depois de `if (updates) tx.update(...)`:

```ts
    if (usage) {
      tx.update(usage.ref, couponUsageWrite(usage, 1))
      if (overLimit) {
        tx.update(db().doc(`orders/${orderId}`), {
          statusHistory: FieldValue.arrayUnion({
            status: 'paid',
            at: now,
            by: 'webhook',
            note: `Cupom ${order.coupon?.code} passou do limite de usos (pedido pago depois de expirar).`,
          }),
        })
      }
    }
    return { order, outcome, couponOverLimit: overLimit }
```

- Fora da transação, depois do `if (outcome.kind === 'alert')`:

```ts
  if (result.couponOverLimit) {
    await sendAdminAlert(
      order.number,
      `O cupom ${order.coupon?.code} passou do limite de usos: o pedido foi pago depois de expirar.`,
    )
  }
```

(desestruturar `couponOverLimit` junto com `order` e `outcome`). As duas escritas no mesmo pedido dentro da transação são permitidas: o Firestore aplica as duas.

- [ ] **Step 8: Rodar e ver passar**

Run: `make test-emulator && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
npx prettier --write src/server tests/integration
git add src/server/db/coupons.ts src/server/checkout/create-order.ts src/server/orders/expire-orders.ts src/server/orders/payment-notification.ts src/server/db/orders.ts tests/integration
git commit -m "fix(coupons): reserve coupon use on order creation and release on expiry or cancel"
```

---

### Task 4: Pagamento: notificação de teste, total mínimo e estorno de pedido cancelado

**Files:**
- Modify: `src/server/integrations/mercadopago.ts` (`getPayment`), `src/server/integrations/mercadopago.test.ts`, `src/server/orders/payment-notification.ts`, `tests/integration/payment-notification.test.ts`, `src/server/checkout/create-order.ts`, `tests/integration/create-order.test.ts`, `src/server/domain/order-status.ts`, `src/server/domain/order-status.test.ts`, `src/server/domain/admin-order.ts`, `src/server/domain/admin-order.test.ts`, `src/server/domain/payment-outcome.test.ts`

**Interfaces:**
- Produces:
  - `getPayment(id): Promise<MpPayment | null>`, que devolve `null` quando o MP responde 404.
  - `MIN_ORDER_CENTS = 100`, exportado de `@/server/checkout/create-order`.
  - Tabela de status: `cancelled: ['refunded']`. `adminTargets('cancelled')` continua `[]`, porque o admin não estorna pela tela um pedido cancelado; quem faz isso é o webhook.

- [ ] **Step 1: Testes que reproduzem**

Em `src/server/integrations/mercadopago.test.ts`, no `describe('getPayment')`:

```ts
  it('pagamento inexistente (notificação de teste do painel) devolve null', async () => {
    fetchMock.mockResolvedValue(json({ message: 'not found' }, 404))
    expect(await getPayment('123')).toBeNull()
  })
```

Em `tests/integration/payment-notification.test.ts`:

```ts
  it('pagamento que o MP não encontra é ignorado (sem 500 em loop)', async () => {
    getPayment.mockResolvedValue(null)
    expect(await handlePaymentNotification('123')).toBe('ignored')
  })

  it('estorno de pedido que o admin cancelou depois de pago → estornado', async () => {
    getPayment.mockResolvedValueOnce(payment())
    await handlePaymentNotification('9001')
    await db().doc('orders/o1').update({ status: 'cancelled' })
    getPayment.mockResolvedValueOnce(payment({ status: 'refunded' }))
    expect(await handlePaymentNotification('9001')).toBe('processed')
    expect(await getOrder('o1')).toMatchObject({
      status: 'refunded',
      payment: { status: 'refunded' },
    })
  })
```

Em `tests/integration/create-order.test.ts`:

```ts
  it('recusa pedido abaixo de R$ 1,00 (o Mercado Pago não aceita valor zero)', async () => {
    quoteShipping.mockResolvedValue([{ ...QUOTES[0], priceCents: 0 }])
    await db()
      .doc('coupons/TUDO')
      .set({
        type: 'percent',
        value: 100,
        minSubtotalCents: null,
        startsAt: null,
        endsAt: null,
        maxUses: null,
        usedCount: 0,
        active: true,
      })
    const result = await createOrder(input({ couponCode: 'TUDO' }), ctx)
    expect(result).toMatchObject({ ok: false, code: 'total_too_low' })
    expect(await allOrders()).toEqual([])
  })
```

Em `src/server/domain/order-status.test.ts`, acrescentar `expect(canTransition('cancelled', 'refunded')).toBe(true)`. Se houver um teste afirmando que `cancelled` é terminal, ajuste-o para "cancelado só vai para estornado". Em `src/server/domain/admin-order.test.ts`, a linha `['cancelled', []]` continua valendo.

Em `src/server/domain/payment-outcome.test.ts`:

```ts
  it('estorno de pedido cancelado com o mesmo pagamento → estornado', () => {
    expect(
      decidePaymentOutcome(
        { ...state, status: 'cancelled', payment: { paymentId: '9001', status: 'approved' } },
        { id: '9001', status: 'refunded', amountCents: 32480 },
      ),
    ).toEqual({ kind: 'transition', to: 'refunded' })
  })
```

(`state` é o estado base que o arquivo já usa; se o nome for outro, use o equivalente.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit src/server/integrations/mercadopago.test.ts src/server/domain && make test-emulator`
Expected: FAIL nos testes novos

- [ ] **Step 3: Corrigir**

Em `src/server/integrations/mercadopago.ts`, `getPayment`:

```ts
export async function getPayment(id: string): Promise<MpPayment | null> {
  if (!/^\d{1,20}$/.test(id)) throw new Error(`id de pagamento inválido: ${id}`)
  const token = serverEnv().MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN ausente')
  const response = await fetch(`${API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  })
  // Notificação de teste do painel ou pagamento de outra conta: nada a fazer, e sem 500 em loop.
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Mercado Pago respondeu ${response.status} em /v1/payments`)
  const data = paymentSchema.parse(await response.json())
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

Em `src/server/orders/payment-notification.ts`, logo depois de `const payment = await getPayment(paymentId)`:

```ts
  if (!payment) {
    console.warn('webhook MP: pagamento não encontrado', { paymentId })
    return 'ignored'
  }
```

Em `src/server/domain/order-status.ts`, trocar `cancelled: []` por:

```ts
  // Cancelado depois de pago e estornado no painel do MP: o webhook do estorno fecha o pedido.
  cancelled: ['refunded'],
```

Em `src/server/domain/admin-order.ts`, `adminTargets`:

```ts
export function adminTargets(from: OrderStatus): OrderStatus[] {
  // Cancelado → estornado só acontece pelo webhook do MP (o admin estorna no painel deles).
  if (from === 'cancelled') return []
  return ADMIN_TARGETS.filter((to) => canTransition(from, to))
}
```

Em `src/server/checkout/create-order.ts`, depois de `computeTotals`:

```ts
  if (totals.totalCents < MIN_ORDER_CENTS) {
    return fail('total_too_low', 'O valor mínimo do pedido é R$ 1,00.')
  }
```

com `export const MIN_ORDER_CENTS = 100` no topo do módulo.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit src/server && make test-emulator && npm run typecheck`
Expected: PASS. O typecheck aponta os chamadores de `getPayment` que não tratam `null`; trate do mesmo jeito.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/server tests/integration
git add src/server tests/integration
git commit -m "fix(payment): ignore unknown payments, enforce minimum total and refund cancelled orders"
```

---

### Task 5: Página do pedido sem pagar duas vezes

**Files:**
- Modify: `src/features/orders/order-view.tsx`, `src/features/orders/order-view.test.tsx`, `src/features/orders/retry-payment-button.tsx`, `src/app/(loja)/pedido/[token]/page.tsx`

**Interfaces:**
- Produces:
  - `OrderViewData` ganha `'payment'`.
  - `OrderView` ganha `returnStatus: string | null`, que é o `status` que o Mercado Pago anexa à `back_url`.
  - `paymentState(order, payable, returnStatus): 'processing' | 'rejected' | 'payable' | 'closed'`, exportado de `order-view.tsx`.
    - `processing`: `payment.status` em `pending`, `in_process`, `authorized` ou `approved`, ou `returnStatus` em `approved`, `pending` ou `in_process`.
    - `rejected`: `payment.status` em `rejected` ou `cancelled`.

- [ ] **Step 1: Testes que reproduzem**

Em `src/features/orders/order-view.test.tsx`:
- No objeto `order`, acrescentar `payment: { preferenceId: 'pref', paymentId: null, status: null, method: null, paidAmountCents: null, paidAt: null },`.
- Em todos os `render(<OrderView ...>)` existentes, acrescentar `returnStatus={null}`.
- Acrescentar:

```tsx
  it('Pix gerado ou cartão em análise: sem "Pagar agora", com aviso de processamento', () => {
    render(
      <OrderView
        order={{ ...order, payment: { ...order.payment, paymentId: '9', status: 'pending' } }}
        token="o1.mac"
        payable
        helpUrl={null}
        returnStatus={null}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
    expect(screen.getByText(/aguardando a confirmação do Mercado Pago/)).toBeInTheDocument()
  })

  it('voltou do Mercado Pago aprovado antes do webhook: não oferece pagar de novo', () => {
    render(
      <OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus="approved" />,
    )
    expect(screen.queryByRole('button', { name: 'Pagar agora' })).not.toBeInTheDocument()
  })

  it('pagamento recusado: avisa e oferece tentar de novo', () => {
    render(
      <OrderView
        order={{ ...order, payment: { ...order.payment, paymentId: '9', status: 'rejected' } }}
        token="o1.mac"
        payable
        helpUrl={null}
        returnStatus={null}
      />,
    )
    expect(screen.getByText(/não foi aprovado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagar agora' })).toBeInTheDocument()
  })

  it('"Pagar agora" continua carregando enquanto vai para o Mercado Pago', async () => {
    retryPaymentAction.mockResolvedValue({ ok: true, data: { redirectUrl: 'https://mp.test' } })
    render(<OrderView order={order} token="o1.mac" payable helpUrl={null} returnStatus={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pagar agora' }))
    await waitFor(() => expect(redirectTo).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /Pagar agora/ })).toBeDisabled()
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project dom src/features/orders/order-view.test.tsx`
Expected: FAIL (o botão aparece em todos os casos; `returnStatus` não existe)

- [ ] **Step 3: Corrigir**

Em `src/features/orders/order-view.tsx`:
- `OrderViewData` passa a incluir `'payment'` no `Pick`.
- Acrescentar:

```ts
const PROCESSING = ['pending', 'in_process', 'authorized', 'approved']

export function paymentState(
  order: Pick<OrderViewData, 'status' | 'payment'>,
  payable: boolean,
  returnStatus: string | null,
): 'processing' | 'rejected' | 'payable' | 'closed' {
  if (order.status !== 'pending_payment' || !payable) return 'closed'
  // O cliente volta do MP antes do webhook: o status da URL e o do pagamento já valem.
  if (PROCESSING.includes(order.payment.status ?? '') || PROCESSING.includes(returnStatus ?? '')) {
    return 'processing'
  }
  if (order.payment.status === 'rejected' || order.payment.status === 'cancelled') return 'rejected'
  return 'payable'
}
```

- Na props do componente, acrescentar `returnStatus: string | null` e calcular `const state = paymentState(order, payable, returnStatus)`.
- Trocar o bloco `{awaitingPayment ? (<><PendingPaymentWatcher /><RetryPaymentButton token={token} /></>) : null}` por:

```tsx
      {state === 'processing' ? (
        <>
          <PendingPaymentWatcher />
          <p role="status" className="border border-info/30 bg-info/5 p-4 text-xs text-info">
            Recebemos seu pagamento e estamos aguardando a confirmação do Mercado Pago. Esta página
            atualiza sozinha; não precisa pagar de novo.
          </p>
        </>
      ) : null}
      {state === 'rejected' ? (
        <p role="alert" className="border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          O último pagamento não foi aprovado. Você pode tentar de novo, com outro cartão ou com Pix.
        </p>
      ) : null}
      {state === 'payable' || state === 'rejected' ? (
        <>
          <PendingPaymentWatcher />
          <RetryPaymentButton token={token} />
        </>
      ) : null}
```

(apagar a variável `awaitingPayment` se ficar sem uso).

Em `src/features/orders/retry-payment-button.tsx`: acrescentar `const [redirecting, setRedirecting] = useState(false)`. No sucesso, chamar `setRedirecting(true)` antes de `redirectTo(...)`. No botão, usar `loading={pending || redirecting}` e `disabled={pending || redirecting}`.

Em `src/app/(loja)/pedido/[token]/page.tsx`: receber `searchParams: Promise<{ status?: string | string[] }>`, ler `const { status } = await searchParams` e passar `returnStatus={typeof status === 'string' ? status : null}` para a `OrderView`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project dom src/features/orders && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/orders "src/app/(loja)/pedido"
git add src/features/orders "src/app/(loja)/pedido"
git commit -m "fix(orders): hide pay-again while a payment is processing"
```

---

### Task 6: Checkout: cupom digitado e corrida do CEP

**Files:**
- Modify: `src/features/checkout/checkout-form.tsx`, `src/features/checkout/checkout-form.test.tsx`

**Interfaces:**
- Produces:
  - Enter no campo do cupom aplica o cupom e não envia o pedido.
  - Pagar com texto no campo do cupom sem cupom aplicado é bloqueado com a mensagem "Aplique o cupom ou apague o campo antes de pagar."
  - `quote()` descarta a resposta de uma cotação que não é a mais recente.

- [ ] **Step 1: Testes que reproduzem**

Em `src/features/checkout/checkout-form.test.tsx`, acrescentar ao `describe('checkout')`:

```tsx
  it('Enter no cupom aplica o cupom e não vai para o pagamento', async () => {
    actions.previewCouponAction.mockResolvedValue({
      ok: true,
      data: { code: 'BEMVINDO', type: 'percent', value: 10, discountCents: 2998 },
    })
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo{Enter}')
    expect(actions.previewCouponAction).toHaveBeenCalledWith('bemvindo', [line])
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('cupom digitado e não aplicado bloqueia o pagamento', async () => {
    renderCheckout()
    const user = await fillAddress()
    await user.click(screen.getByRole('radio', { name: /SEDEX/ }))
    await user.type(screen.getByLabelText('Cupom'), 'bemvindo')
    await user.click(payButton())
    expect(await screen.findByText('Aplique o cupom ou apague o campo antes de pagar.')).toBeInTheDocument()
    expect(actions.createOrderAction).not.toHaveBeenCalled()
  })

  it('resposta antiga do CEP não sobrescreve a do CEP corrigido', async () => {
    let releaseOld: (value: unknown) => void = () => {}
    actions.lookupCepAction
      .mockImplementationOnce(() => new Promise((resolve) => (releaseOld = resolve)))
      .mockResolvedValueOnce({
        ok: true,
        data: { street: 'Rua Nova', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ' },
      })
    renderCheckout()
    const user = userEvent.setup()
    await screen.findByText('Camiseta')
    await user.type(screen.getByLabelText('CEP'), '01001000')
    await user.clear(screen.getByLabelText('CEP'))
    await user.type(screen.getByLabelText('CEP'), '20040002')
    await waitFor(() => expect(screen.getByLabelText('Rua')).toHaveValue('Rua Nova'))
    releaseOld({
      ok: true,
      data: { street: 'Praça da Sé', neighborhood: 'Sé', city: 'São Paulo', state: 'SP' },
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua Nova')
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project dom src/features/checkout/checkout-form.test.tsx`
Expected: FAIL nos três

- [ ] **Step 3: Corrigir**

Em `src/features/checkout/checkout-form.tsx`:
- Acrescentar `const quoteRequest = useRef(0)` ao lado de `request`.
- Em `quote`, no começo: `const id = ++quoteRequest.current`. Logo depois do `await Promise.all(...)`, acrescentar `if (id !== quoteRequest.current) return`. No `catch`, só notificar se `id === quoteRequest.current`.
- Em `onCepChange` e `chooseSaved`, invalidar a cotação em voo quando o CEP fica incompleto: `if (cep.length !== 8) quoteRequest.current += 1`.
- No campo do cupom, acrescentar ao `TextField`:

```tsx
                onKeyDown={(event) => {
                  // Enter aqui aplica o cupom; sem isso, o form enviaria o pedido sem o desconto.
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    applyCoupon()
                  }
                }}
```

- Em `submit`, depois da validação do frete:

```ts
    if (couponInput.trim() && !coupon) {
      notify({ form: 'Aplique o cupom ou apague o campo antes de pagar.' })
      return
    }
```

- Ao aplicar um cupom com sucesso, não limpar `couponInput`. Ao clicar em "Remover" o cupom, limpar `couponInput` (`setCouponInput('')`), para não bloquear o pagamento.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project dom src/features/checkout && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/checkout
git add src/features/checkout
git commit -m "fix(checkout): apply coupon on enter and ignore stale cep responses"
```

---

### Task 7: Sacola: cliques rápidos e nomes que a sacola aceita

**Files:**
- Modify: `src/lib/cart.ts`, `src/lib/cart.test.ts`, `src/features/cart/cart-context.tsx`, `src/features/cart/cart-drawer.tsx`, `src/features/cart/cart.test.tsx`, `src/lib/admin-product.ts`, `src/lib/admin-product.test.ts`

**Interfaces:**
- Produces:
  - `MAX_SIZE_LENGTH = 20` e `MAX_COLOR_LENGTH = 40` em `@/lib/cart`, usados no `lineSchema`.
  - `changeLineQty(lines: CartLine[], key: string, delta: number): CartLine[]` em `@/lib/cart`.
  - O contexto ganha `changeQty: (key: string, delta: number) => void`.
  - `productFormSchema` recusa tamanho maior que 20, nome de cor maior que 40 e nomes de cor repetidos.

- [ ] **Step 1: Testes que reproduzem**

Em `src/lib/cart.test.ts`:

```ts
describe('changeLineQty', () => {
  it('soma sobre a quantidade atual (cliques rápidos não se perdem)', () => {
    const lines = [{ productId: 'p1', size: 'M', color: null, qty: 1 }]
    const twice = changeLineQty(changeLineQty(lines, 'p1|M|', 1), 'p1|M|', 1)
    expect(twice[0]?.qty).toBe(3)
    expect(changeLineQty(lines, 'p1|M|', -1)).toEqual([])
  })
})
```

Em `src/features/cart/cart.test.tsx`:

```tsx
  it('dois cliques rápidos em + somam dois', async () => {
    priceCartAction.mockImplementation(async (lines: { qty: number }[]) => priced(lines[0]?.qty ?? 1))
    renderCart()
    await userEvent.click(screen.getByRole('button', { name: 'adicionar' }))
    const plus = await screen.findByRole('button', { name: /Aumentar quantidade/ })
    await userEvent.click(plus)
    await userEvent.click(plus)
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]')[0].qty).toBe(3),
    )
  })
```

Em `src/lib/admin-product.test.ts`, no `it.each` de erros:

```ts
    [{ sizes: 'P, ' + 'X'.repeat(21) }, 'sizes', 'Tamanho com até 20 caracteres'],
    [
      { colors: [{ name: 'X'.repeat(41), hex: '#000000', image: null }] },
      'colors',
      'Nome da cor com até 40 caracteres',
    ],
    [
      {
        colors: [
          { name: 'Preto', hex: '#000000', image: null },
          { name: 'preto', hex: '#111111', image: null },
        ],
      },
      'colors',
      'Cada cor precisa de um nome diferente',
    ],
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/cart.test.ts src/features/cart src/lib/admin-product.test.ts`
Expected: FAIL nos novos

- [ ] **Step 3: Corrigir**

Em `src/lib/cart.ts`:

```ts
export const MAX_SIZE_LENGTH = 20
export const MAX_COLOR_LENGTH = 40
```

Trocar no `lineSchema`: `size: z.string().min(1).max(MAX_SIZE_LENGTH)` e `color: z.string().min(1).max(MAX_COLOR_LENGTH).nullable()`. Acrescentar:

```ts
/** Soma sobre a quantidade atual: dois cliques antes do servidor responder contam os dois. */
export function changeLineQty(lines: CartLine[], key: string, delta: number): CartLine[] {
  const line = lines.find((candidate) => lineKey(candidate) === key)
  return line ? setLineQty(lines, key, line.qty + delta) : lines
}
```

Em `src/features/cart/cart-context.tsx`: acrescentar `changeQty: (key: string, delta: number) => void` ao tipo, implementar com `useCallback((key, delta) => update((current) => changeLineQty(current, key, delta)), [])` e incluir no `value` e nas dependências do `useMemo`.

Em `src/features/cart/cart-drawer.tsx`: os botões passam a chamar `cart.changeQty(line.key, -1)` e `cart.changeQty(line.key, 1)`. A quantidade exibida e o `disabled` usam a quantidade local, que é a fonte da verdade do cliente:

```tsx
const localQty = cart.lines.find((l) => lineKey(l) === line.key)?.qty ?? line.qty
```

(importar `lineKey` de `@/lib/cart`; usar `localQty` no `<span>` e em `disabled={localQty >= MAX_QTY}`).

Em `src/lib/admin-product.ts`:
- Importar `MAX_COLOR_LENGTH, MAX_SIZE_LENGTH` de `./cart`.
- Em `sizes`, depois do `refine` existente: `.refine((sizes) => sizes.every((s) => s.length <= MAX_SIZE_LENGTH), 'Tamanho com até 20 caracteres')`.
- Trocar `colors: z.array(productColorSchema)` por:

```ts
    colors: z
      .array(productColorSchema)
      .refine(
        (colors) => colors.every((c) => c.name.trim().length <= MAX_COLOR_LENGTH),
        'Nome da cor com até 40 caracteres',
      )
      .refine(
        (colors) =>
          new Set(colors.map((c) => c.name.trim().toLowerCase())).size === colors.length,
        'Cada cor precisa de um nome diferente',
      ),
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib src/features/cart src/features/admin && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/lib src/features/cart
git add src/lib/cart.ts src/lib/cart.test.ts src/features/cart src/lib/admin-product.ts src/lib/admin-product.test.ts
git commit -m "fix(cart): keep quick quantity clicks and reject names the cart would drop"
```

---

### Task 8: CEP preenche sem apagar, também nos endereços da conta

**Files:**
- Modify: `src/lib/cep.ts`, `src/lib/cep.test.ts`, `src/features/checkout/checkout-form.tsx` (`quote`), `src/features/account/address-book.tsx`, `src/features/account/address-book.test.tsx`

**Interfaces:**
- Produces: `fillFromCep<T extends Record<string, string>>(current: T, found: Partial<Record<keyof T, string>>): T`, que copia só os campos não vazios de `found`.

- [ ] **Step 1: Testes que reproduzem**

Em `src/lib/cep.test.ts`:

```ts
describe('fillFromCep', () => {
  it('não apaga o que o cliente digitou quando o ViaCEP vem sem rua (CEP de cidade inteira)', () => {
    const current = { street: 'Rua Única', neighborhood: 'Centro', city: '', state: '' }
    expect(fillFromCep(current, { street: '', neighborhood: '', city: 'Cidade', state: 'MG' })).toEqual(
      { street: 'Rua Única', neighborhood: 'Centro', city: 'Cidade', state: 'MG' },
    )
  })
})
```

Em `src/features/account/address-book.test.tsx`:

```tsx
  it('CEP de cidade inteira não apaga a rua digitada e CEP não encontrado avisa', async () => {
    lookupCepAction
      .mockResolvedValueOnce({
        ok: true,
        data: { street: '', neighborhood: '', city: 'Cidade Pequena', state: 'MG' },
      })
      .mockResolvedValueOnce({ ok: false, code: 'cep_not_found', message: 'CEP não encontrado.' })
    render(<AddressBook addresses={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo endereço' }))
    await userEvent.type(screen.getByLabelText('Rua'), 'Rua Única')
    await userEvent.type(screen.getByLabelText('CEP'), '35000000')
    await waitFor(() => expect(screen.getByLabelText('Cidade')).toHaveValue('Cidade Pequena'))
    expect(screen.getByLabelText('Rua')).toHaveValue('Rua Única')

    await userEvent.clear(screen.getByLabelText('CEP'))
    await userEvent.type(screen.getByLabelText('CEP'), '99999999')
    expect(await screen.findByText('CEP não encontrado.')).toBeInTheDocument()
  })

  it('buscar o CEP não deixa o botão de salvar carregando', async () => {
    lookupCepAction.mockImplementation(() => new Promise(() => {}))
    render(<AddressBook addresses={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo endereço' }))
    await userEvent.type(screen.getByLabelText('CEP'), '01310100')
    expect(screen.getByRole('button', { name: 'Salvar endereço' })).toBeEnabled()
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/cep.test.ts src/features/account/address-book.test.tsx`
Expected: FAIL nos novos

- [ ] **Step 3: Corrigir**

Em `src/lib/cep.ts`:

```ts
/** Preenche com o ViaCEP sem apagar o que já foi digitado (CEP de cidade inteira vem sem rua). */
export function fillFromCep<T extends Record<string, string>>(
  current: T,
  found: Partial<Record<keyof T, string>>,
): T {
  const filled = Object.entries(found).filter(([, value]) => typeof value === 'string' && value)
  return { ...current, ...Object.fromEntries(filled) }
}
```

Em `src/features/checkout/checkout-form.tsx`, dentro de `quote`, trocar o filtro manual de campos vazios por `setAddress((current) => fillFromCep(current, found.data))`.

Em `src/features/account/address-book.tsx`, `AddressForm`:
- Acrescentar `const [lookingUp, startLookup] = useTransition()` e `const lookup = useRef(0)`.
- Reescrever `onCepChange`:

```tsx
  function onCepChange(raw: string) {
    patch({ cep: formatCep(raw) })
    setErrors((current) => ({ ...current, cep: undefined }))
    const cep = normalizeCep(raw)
    const id = ++lookup.current
    if (cep.length !== 8) return
    startLookup(async () => {
      try {
        const found = await lookupCepAction(cep)
        if (id !== lookup.current) return
        if (found.ok) setDraft((current) => fillFromCep(current, found.data))
        else if (found.code !== 'cep_unavailable') {
          setErrors((current) => ({ ...current, cep: found.message }))
        }
      } catch {
        // Sem conexão: o cliente preenche o endereço à mão.
      }
    })
  }
```

- O botão "Salvar endereço" continua usando só `pending`, a transição do salvar. `lookingUp` pode mostrar um `Spinner` ao lado do CEP, se quiser.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/cep.test.ts src/features/account src/features/checkout && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/lib/cep.ts src/lib/cep.test.ts src/features
git add src/lib/cep.ts src/lib/cep.test.ts src/features/checkout/checkout-form.tsx src/features/account/address-book.tsx src/features/account/address-book.test.tsx
git commit -m "fix(account): keep typed address fields when looking up a cep"
```

---

### Task 9: Upload de fotos sem perder edições

**Files:**
- Modify: `src/features/admin/image-list-field.tsx`, `src/features/admin/image-list-field.test.tsx`, `src/features/admin/product-form.tsx`, `src/features/admin/product-form.test.tsx`, `src/features/admin/collection-form.tsx`

**Interfaces:**
- Produces: `ImageListField` passa a receber:
  - `onChange: (update: (current: ProductImage[]) => ProductImage[]) => void`, uma atualização funcional;
  - `onUploadingChange?: (uploading: boolean) => void`.
  - Os formulários desabilitam "Salvar" enquanto há upload.

- [ ] **Step 1: Testes que reproduzem**

Em `src/features/admin/image-list-field.test.tsx`:
- O `Harness` passa a usar `onChange={(update) => setValue((current) => update(current))}`.
- Acrescentar:

```tsx
  it('remover uma foto durante o upload não é desfeito quando o upload termina', async () => {
    let finish: (value: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise((resolve) => (finish = resolve)))
    render(<Harness initial={[img(1), img(2)]} />)
    await userEvent.upload(
      screen.getByLabelText('Adicionar fotos'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    )
    await userEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0]!)
    expect(screen.getByTestId('ids')).toHaveTextContent('2')
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    finish(
      new Response(
        JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/n.jpg', public_id: 'n' }),
      ),
    )
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('2,n'))
  })
```

Em `src/features/admin/product-form.test.tsx`:

```tsx
  it('não deixa salvar enquanto uma foto está subindo', async () => {
    const signUploadAction = vi.mocked((await import('./upload-actions')).signUploadAction)
    signUploadAction.mockImplementation(() => new Promise(() => {}))
    render(
      <ProductForm productId={null} initial={{ ...productToForm(null), images: [image] }} collections={[]} />,
    )
    await userEvent.upload(
      screen.getByLabelText('Adicionar fotos'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    )
    expect(screen.getByRole('button', { name: 'Salvar produto' })).toBeDisabled()
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project dom src/features/admin`
Expected: FAIL (o tipo do `onChange` muda; o upload restaura a lista antiga; o botão continua habilitado)

- [ ] **Step 3: Corrigir**

Em `src/features/admin/image-list-field.tsx`:
- Trocar o tipo da prop por `onChange: (update: (current: ProductImage[]) => ProductImage[]) => void` e acrescentar `onUploadingChange?: (uploading: boolean) => void`.
- `move`: `onChange((current) => { const next = [...current]; const [item] = next.splice(index, 1); if (!item) return current; next.splice(index + delta, 0, item); return next })`.
- Remover: `onChange((current) => current.filter((_, i) => i !== index))`.
- Alt: `onChange((current) => current.map((item, i) => (i === index ? { ...item, alt: value } : item)))`.
- `upload`:

```ts
  async function upload(files: FileList | null) {
    if (!files?.length) return
    const queue = Array.from(files).slice(0, max ? max - value.length : undefined)
    setMessage(null)
    setUploading(true)
    onUploadingChange?.(true)
    try {
      for (const file of queue) {
        const image = await uploadImage(file)
        // Acrescenta sobre o estado atual: edições feitas durante o upload ficam.
        onChange((current) => [...current, image])
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível enviar a foto.')
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
    }
  }
```

Em `src/features/admin/product-form.tsx`:
- Acrescentar `const [uploading, setUploading] = useState(false)`.
- No `ImageListField`, usar `onChange={(update) => setValues((c) => ({ ...c, images: update(c.images) }))}` e `onUploadingChange={setUploading}`.
- O botão de enviar fica com `disabled={uploading}`.

Em `src/features/admin/collection-form.tsx`: aplicar a mesma troca nos três `ImageListField`, convertendo de e para URLs dentro do updater. Exemplo da galeria:

```tsx
        onChange={(update) =>
          setValues((c) => ({ ...c, gallery: asUrls(update(asImages(c.gallery))) }))
        }
```

e, na capa e na foto de hover, `setValues((c) => ({ ...c, coverImage: asUrls(update(asImages(c.coverImage ? [c.coverImage] : [])))[0] ?? '' }))`. Acrescentar o mesmo estado `uploading` com `disabled` no botão "Salvar coleção".

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project dom src/features/admin && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/admin
git add src/features/admin
git commit -m "fix(admin): keep edits made during photo upload and block saving meanwhile"
```

---

### Task 10: Lista de produtos: ordem do destaque

**Files:**
- Modify: `src/features/admin/product-row-actions.tsx`, `src/app/admin/produtos/page.tsx`
- Create: `src/features/admin/product-row-actions.test.tsx`

**Interfaces:**
- Produces: `ProductRowActions` ganha `nextFeaturedOrder: number`, que é o maior `featuredOrder` + 1. O campo de ordem só grava quando o valor muda e é um inteiro positivo.

- [ ] **Step 1: Teste que reproduz**

`src/features/admin/product-row-actions.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
const actions = vi.hoisted(() => ({
  setProductStatusAction: vi.fn(),
  setProductFeaturedAction: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./catalog-actions', () => actions)

import { ProductRowActions } from './product-row-actions'

beforeEach(() => {
  vi.clearAllMocks()
  actions.setProductFeaturedAction.mockResolvedValue({ ok: true, data: null })
  actions.setProductStatusAction.mockResolvedValue({ ok: true, data: null })
})

describe('ProductRowActions', () => {
  it('sair do campo sem mudar a ordem não grava', async () => {
    render(<ProductRowActions id="p1" status="active" featured featuredOrder={2} nextFeaturedOrder={3} />)
    await userEvent.click(screen.getByLabelText('Ordem do destaque'))
    await userEvent.tab()
    expect(actions.setProductFeaturedAction).not.toHaveBeenCalled()
  })

  it('ordem inválida avisa sem gravar', async () => {
    render(<ProductRowActions id="p1" status="active" featured featuredOrder={2} nextFeaturedOrder={3} />)
    await userEvent.clear(screen.getByLabelText('Ordem do destaque'))
    await userEvent.tab()
    expect(screen.getByText('Ordem inválida')).toBeInTheDocument()
    expect(actions.setProductFeaturedAction).not.toHaveBeenCalled()
  })

  it('destacar usa a próxima posição livre', async () => {
    render(
      <ProductRowActions id="p1" status="active" featured={false} featuredOrder={null} nextFeaturedOrder={4} />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Destacar' }))
    expect(actions.setProductFeaturedAction).toHaveBeenCalledWith('p1', true, 4)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project dom src/features/admin/product-row-actions.test.tsx`
Expected: FAIL

- [ ] **Step 3: Corrigir**

Em `src/features/admin/product-row-actions.tsx`:
- Acrescentar a prop `nextFeaturedOrder: number`.
- O `onBlur` passa a ser:

```tsx
            onBlur={() => {
              const value = Number.parseInt(order, 10)
              if (!Number.isSafeInteger(value) || value < 1) {
                setMessage('Ordem inválida')
                return
              }
              if (value !== featuredOrder) run(() => setProductFeaturedAction(id, true, value))
            }}
```

- "Destacar" chama `setProductFeaturedAction(id, true, nextFeaturedOrder)`.

Em `src/app/admin/produtos/page.tsx`: calcular `const nextFeaturedOrder = Math.max(0, ...products.map((p) => p.featuredOrder ?? 0)) + 1` e passar a prop. Usar `key={`${product.id}-${product.featuredOrder ?? 'x'}`}` no `<li>`, para o campo se realinhar depois de um refresh.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project dom src/features/admin && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/features/admin src/app/admin
git add src/features/admin src/app/admin/produtos/page.tsx
git commit -m "fix(admin): save featured order only when it changes"
```

---

### Task 11: WhatsApp com DDI e dica visível

**Files:**
- Modify: `src/lib/admin-settings.ts`, `src/lib/admin-settings.test.ts`, `src/components/ui/text-field.tsx`, `src/features/admin/settings-form.tsx`

**Interfaces:**
- Produces:
  - O `whatsapp` do `settingsFormSchema` acrescenta `55` quando recebe 10 ou 11 dígitos, aceita vazio ou `^55\d{10,11}$`, e recusa o resto com "Use DDD + número, ex.: 11 98765-4321".
  - `TextField` ganha `hint?: string`.

- [ ] **Step 1: Teste que reproduz**

Em `src/lib/admin-settings.test.ts`:

```ts
  it.each([
    ['11 98765-4321', '5511987654321'],
    ['(11) 3333-4444', '551133334444'],
    ['+55 11 98765-4321', '5511987654321'],
    ['', ''],
  ])('WhatsApp %s → %s', (input, digits) => {
    expect(
      settingsFormSchema.parse({ ...settingsToForm(DEFAULT_STORE_SETTINGS), whatsapp: input })
        .whatsapp,
    ).toBe(digits)
  })

  it('WhatsApp curto demais é recusado', () => {
    const result = settingsFormSchema.safeParse({
      ...settingsToForm(DEFAULT_STORE_SETTINGS),
      whatsapp: '98765-4321',
    })
    expect(result.error?.issues[0]?.path).toEqual(['whatsapp'])
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit src/lib/admin-settings.test.ts`
Expected: FAIL

- [ ] **Step 3: Corrigir**

Em `src/lib/admin-settings.ts`, trocar o `whatsapp`:

```ts
    // wa.me precisa do DDI: sem o 55, "11 9…" vira um número dos EUA.
    whatsapp: z
      .string()
      .transform(digits)
      .transform((d) => (d.length === 10 || d.length === 11 ? `55${d}` : d))
      .refine((d) => d === '' || /^55\d{10,11}$/.test(d), 'Use DDD + número, ex.: 11 98765-4321'),
```

Em `src/components/ui/text-field.tsx`: aceitar `hint?: string` e repassar para `<Field label={label} error={error} hint={hint}>`.

Em `src/features/admin/settings-form.tsx`: passar `hint={field.hint}` em vez de `placeholder`. Mudar a dica do WhatsApp para "DDD + número, ex.: 11 98765-4321 (o 55 é colocado sozinho)" e trocar o rótulo `Endereço (aparece nos termos)` por `Endereço da empresa`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/admin-settings.test.ts src/features/admin src/components && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/lib/admin-settings.ts src/lib/admin-settings.test.ts src/components/ui/text-field.tsx src/features/admin/settings-form.tsx
git add src/lib/admin-settings.ts src/lib/admin-settings.test.ts src/components/ui/text-field.tsx src/features/admin/settings-form.tsx
git commit -m "fix(admin): store whatsapp with country code and show field hints"
```

---

### Task 12: Erro de rede não derruba a página

**Files:**
- Create: `src/lib/attempt.ts`, `src/lib/attempt.test.ts`, `src/components/layout/error-screen.tsx`, `src/app/(loja)/error.tsx`, `src/app/admin/error.tsx`
- Modify: `src/app/error.tsx`, `src/features/account/{address-book,profile-form,verify-email-notice}.tsx`, `src/features/admin/{product-form,collection-form,coupon-manager,settings-form,order-status-actions,product-row-actions}.tsx`, `src/features/account/profile-form.test.tsx`

**Interfaces:**
- Produces:
  - `attempt<T>(action: () => Promise<Result<T>>): Promise<Result<T>>`, que transforma exceção em `fail('network', 'Sem conexão ou erro inesperado. Tente de novo.')`.
  - `ErrorScreen({ reset })`: componente client, sem `<main>`.

- [ ] **Step 1: Testes que reproduzem**

`src/lib/attempt.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { attempt } from './attempt'

describe('attempt', () => {
  it('devolve o resultado normal', async () => {
    expect(await attempt(async () => ({ ok: true as const, data: 1 }))).toEqual({ ok: true, data: 1 })
  })

  it('erro de rede vira falha com mensagem', async () => {
    expect(
      await attempt(async () => {
        throw new TypeError('Failed to fetch')
      }),
    ).toEqual({
      ok: false,
      code: 'network',
      message: 'Sem conexão ou erro inesperado. Tente de novo.',
    })
  })
})
```

Em `src/features/account/profile-form.test.tsx`:

```tsx
  it('erro de rede mostra a mensagem e mantém o que foi digitado', async () => {
    updateProfileAction.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<ProfileForm initial={initial} />)
    await userEvent.clear(screen.getByLabelText('Nome completo'))
    await userEvent.type(screen.getByLabelText('Nome completo'), 'Ana Maria')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Sem conexão/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Maria')
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/attempt.test.ts src/features/account/profile-form.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implementar**

`src/lib/attempt.ts`:

```ts
import { fail, type Result } from './result'

/** Chamada de Server Action que pode lançar (rede, deploy no meio): vira Result para o formulário. */
export async function attempt<T>(action: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await action()
  } catch {
    return fail('network', 'Sem conexão ou erro inesperado. Tente de novo.')
  }
}
```

Em cada componente da lista, trocar `await xAction(...)` dentro de `start(async () => ...)` por `await attempt(() => xAction(...))`:
- `address-book.tsx`: `saveAddressAction`, `deleteAddressAction` e `setDefaultAddressAction`.
- `profile-form.tsx`, `verify-email-notice.tsx`, `product-form.tsx`, `collection-form.tsx`, `coupon-manager.tsx`, `settings-form.tsx`.
- `order-status-actions.tsx`: as duas actions.
- `product-row-actions.tsx`.

Em `verify-email-notice.tsx`, o `redirect` da action não é exceção de rede: o Next trata o redirect antes de devolver ao cliente, então o `attempt` não o engole. Se o teste mostrar o contrário, deixe esse componente sem `attempt` e registre a decisão no ledger.

`src/components/layout/error-screen.tsx`:

```tsx
'use client'

export function ErrorScreen({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-black tracking-tighter uppercase italic">Algo deu errado</h1>
      <p className="text-sm text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="bg-paper px-6 py-3 text-xs font-black tracking-[0.2em] text-ink uppercase"
      >
        Tentar de novo
      </button>
    </div>
  )
}
```

`src/app/error.tsx` passa a renderizar `<main className="min-h-dvh"><ErrorScreen reset={reset} /></main>`. `src/app/(loja)/error.tsx` e `src/app/admin/error.tsx`:

```tsx
'use client'

import { ErrorScreen } from '@/components/layout/error-screen'

// Erro dentro do segmento: o header, a sacola e a navegação continuam na tela.
export default function SegmentError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorScreen reset={reset} />
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/attempt.test.ts src/features && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/lib/attempt.ts src/lib/attempt.test.ts src/components src/app src/features
git add src/lib/attempt.ts src/lib/attempt.test.ts src/components/layout/error-screen.tsx src/app/error.tsx "src/app/(loja)/error.tsx" src/app/admin/error.tsx src/features
git commit -m "fix(ui): show action errors inline and keep layout on segment errors"
```

---

### Task 13: Admin exige e-mail verificado

**Files:**
- Modify: `src/server/auth/session.ts` (`requireAdmin`), `src/server/auth/session.test.ts`, `scripts/grant-admin.ts`

**Interfaces:**
- Produces:
  - `requireAdmin()` responde 404 se `!user.isAdmin || !user.emailVerified`.
  - `grant-admin` recusa a conta sem e-mail verificado e mostra os provedores.

- [ ] **Step 1: Teste que reproduz**

Em `src/server/auth/session.test.ts`, no `describe` de `requireAdmin` (ou num novo):

```ts
  it('admin sem e-mail verificado não entra', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.com',
      email_verified: false,
      admin: true,
    })
    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND')
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit src/server/auth/session.test.ts`
Expected: FAIL

- [ ] **Step 3: Corrigir**

Em `requireAdmin`:

```ts
  // E-mail verificado também: quem criou antes uma conta com o e-mail promovido não vira admin.
  if (!user.isAdmin || !user.emailVerified) notFound()
```

Em `scripts/grant-admin.ts`, depois de `getUserByEmail`:

```ts
  const providers = user.providerData.map((p) => p.providerId).join(', ') || 'nenhum'
  if (!user.emailVerified) {
    console.error(
      `✗ ${email} ainda não confirmou o e-mail (provedores: ${providers}). Confirme antes de dar admin.`,
    )
    process.exit(1)
  }
  console.log(`Conta ${user.uid} · provedores: ${providers}`)
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit src/server/auth/session.test.ts && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/server/auth scripts/grant-admin.ts
git add src/server/auth scripts/grant-admin.ts
git commit -m "fix(auth): require a verified email for admin access"
```

---

### Task 14: Corrigir o código de rastreio

**Files:**
- Modify: `src/server/db/orders.ts`, `tests/integration/admin-orders.test.ts`, `src/server/orders/order-emails.ts`, `tests/integration/order-shipped-email.test.ts`, `src/features/admin/order-actions.ts`, `src/features/admin/order-actions.test.ts`, `src/features/admin/order-status-actions.tsx`, `src/features/admin/order-status-actions.test.tsx`, `src/app/admin/pedidos/[id]/page.tsx`

**Interfaces:**
- Produces:
  - `updateTracking(id: string, code: string, by: string, now: Date): Promise<Result<null>>`. Vale para `shipped` e `delivered`. Troca `tracking`, zera `notifications.shippedSentAt` e registra no histórico, com o status atual, a nota `Rastreio corrigido para <code>`.
  - A chave de idempotência do e-mail de envio passa a ser `order-shipped/<orderId>/<code>`, para que um código corrigido gere e-mail novo.
  - `updateTrackingAction(orderId: string, code: unknown): Promise<Result<{ emailSent: boolean }>>`.
  - `OrderStatusActions` ganha `canEditTracking: boolean`, com o botão "Corrigir rastreio".

- [ ] **Step 1: Testes que reproduzem**

Em `tests/integration/admin-orders.test.ts`:

```ts
describe('updateTracking', () => {
  const tracking = { carrier: 'Correios', code: 'AA000000000BR', url: 'https://x' }

  it('troca o código, libera um novo e-mail e registra', async () => {
    await seed('a', {
      status: 'shipped',
      tracking,
      notifications: { confirmationSentAt: NOW, shippedSentAt: NOW, adminAlertSentAt: NOW },
    })
    expect(await updateTracking('a', 'BB111111111BR', 'adm', LATER)).toEqual({ ok: true, data: null })
    const order = await getOrder('a')
    expect(order?.tracking?.code).toBe('BB111111111BR')
    expect(order?.notifications.shippedSentAt).toBeNull()
    expect(order?.statusHistory.at(-1)).toMatchObject({
      status: 'shipped',
      by: 'adm',
      note: 'Rastreio corrigido para BB111111111BR',
    })
  })

  it('pedido que não foi enviado não aceita', async () => {
    await seed('a', { status: 'paid' })
    expect(await updateTracking('a', 'BB111111111BR', 'adm', LATER)).toMatchObject({
      code: 'invalid_transition',
    })
  })
})
```

(importar `updateTracking`).

Em `tests/integration/order-shipped-email.test.ts`, no primeiro teste, trocar `idempotencyKey: 'order-shipped/a'` por `idempotencyKey: 'order-shipped/a/AB123456789BR'`.

Em `src/features/admin/order-status-actions.test.tsx`:

```tsx
  it('corrige o rastreio', async () => {
    actions.updateTrackingAction.mockResolvedValue({ ok: true, data: { emailSent: true } })
    render(
      <OrderStatusActions orderId="o1" targets={['delivered']} shippedEmailPending={false} canEditTracking />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Corrigir rastreio' }))
    await userEvent.type(screen.getByLabelText('Novo código de rastreio'), 'BB111111111BR')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar rastreio' }))
    expect(actions.updateTrackingAction).toHaveBeenCalledWith('o1', 'BB111111111BR')
  })
```

(acrescentar `updateTrackingAction: vi.fn()` ao objeto `actions` do `vi.hoisted` e `canEditTracking={false}` nos renders existentes).

Em `src/features/admin/order-actions.test.ts`, acrescentar `updateTracking: vi.fn()` ao mock de `orders` e:

```ts
describe('updateTrackingAction', () => {
  it('valida o código, grava com o uid e envia o e-mail novo', async () => {
    orders.updateTracking.mockResolvedValue({ ok: true, data: null })
    expect(await updateTrackingAction('o1', ' bb111111111br ')).toEqual({
      ok: true,
      data: { emailSent: true },
    })
    expect(orders.updateTracking).toHaveBeenCalledWith('o1', 'BB111111111BR', 'admin-uid', expect.any(Date))
    expect(await updateTrackingAction('o1', 'x')).toMatchObject({ ok: false })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/admin && make test-emulator`
Expected: FAIL nos novos

- [ ] **Step 3: Implementar**

Em `src/server/db/orders.ts`:

```ts
export async function updateTracking(
  id: string,
  code: string,
  by: string,
  now: Date,
): Promise<Result<null>> {
  const ref = ordersCollection().doc(id)
  return db().runTransaction(async (tx) => {
    const order = (await tx.get(ref)).data()
    if (!order) return fail('not_found', 'Pedido não encontrado.')
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      return fail('invalid_transition', 'Só dá para corrigir o rastreio de pedido enviado.')
    }
    tx.update(ref, {
      tracking: { carrier: order.shipping.company || 'Correios', code, url: trackingUrl(code) },
      // O código mudou: o e-mail com o rastreio certo precisa sair de novo.
      'notifications.shippedSentAt': null,
      statusHistory: FieldValue.arrayUnion({
        status: order.status,
        at: now,
        by,
        note: `Rastreio corrigido para ${code}`,
      }),
      updatedAt: now,
    })
    return ok(null)
  })
}
```

Em `src/server/orders/order-emails.ts`, trocar a chave de idempotência por ``idempotencyKey: `order-shipped/${orderId}/${order.tracking.code}` ``.

Em `src/lib/admin-orders.ts`, extrair o schema do código para reuso:

```ts
export const trackingCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Informe o código de rastreio.')
  .regex(/^[A-Z0-9]{8,30}$/, 'Código de rastreio inválido.')
```

e usar `trackingCode: trackingCodeSchema` no `adminTransitionSchema`.

Em `src/features/admin/order-actions.ts`:

```ts
export async function updateTrackingAction(
  orderId: string,
  code: unknown,
): Promise<Result<{ emailSent: boolean }>> {
  const admin = await requireAdmin()
  if (!isId(orderId)) return BAD_ID
  const parsed = trackingCodeSchema.safeParse(code)
  if (!parsed.success) {
    return fail('invalid_input', parsed.error.issues[0]?.message ?? 'Código inválido.')
  }
  const updated = await updateTracking(orderId, parsed.data, admin.uid, new Date())
  if (!updated.ok) return updated
  return ok({ emailSent: await trySendShipped(orderId) })
}
```

Em `src/features/admin/order-status-actions.tsx`:
- Acrescentar a prop `canEditTracking: boolean` e um estado `editingTracking`/`newCode`.
- Quando `canEditTracking`, mostrar o botão "Corrigir rastreio". Ele abre um `TextField` com o rótulo "Novo código de rastreio" e o botão "Salvar rastreio", que chama `attempt(() => updateTrackingAction(orderId, newCode))` e mostra a mesma mensagem de `emailSent` das transições.

Em `src/app/admin/pedidos/[id]/page.tsx`: passar `canEditTracking={order.status === 'shipped' || order.status === 'delivered'}`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/admin src/lib && make test-emulator && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src tests
git add src tests
git commit -m "feat(admin): allow correcting a tracking code and resend the tracking email"
```

---

### Task 15: Cron que não trava com um pedido ruim

**Files:**
- Modify: `src/server/orders/expire-orders.ts`, `tests/integration/expire-orders.test.ts`

- [ ] **Step 1: Teste que reproduz**

```ts
  it('um pedido fora do formato não impede os outros de expirar', async () => {
    const past = new Date(NOW.getTime() - HOUR)
    await db()
      .doc('orders/quebrado')
      .set({ ...orderDoc({ expiresAt: past }), totals: 'x' })
    await ordersCollection().doc('bom').set(orderDoc({ expiresAt: past, number: 'SS-1002' }))
    expect(await expirePendingOrders(NOW)).toBe(1)
    expect((await getOrder('bom'))?.status).toBe('expired')
  })
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `make test-emulator`
Expected: FAIL (o converter lança e o cron para)

- [ ] **Step 3: Corrigir**

Em `src/server/orders/expire-orders.ts`, envolver o corpo do `for` num `try/catch`:

```ts
  for (const doc of due.docs) {
    try {
      const changed = await db().runTransaction(/* ...como hoje... */)
      if (changed) expired += 1
    } catch (error) {
      // Um documento quebrado não pode travar o cron todo dia: registra e segue.
      console.error('cron: não foi possível expirar o pedido', { orderId: doc.id, error })
    }
  }
```

A leitura `due.docs` não chama o converter; quem lança é o `tx.get(...).data()`, que agora está dentro do `try`. Se a consulta inicial já lançar por causa do converter, troque `ordersCollection()` pela coleção crua `db().collection('orders')` só nessa consulta, porque a transação relê pelo converter.

- [ ] **Step 4: Rodar e ver passar**

Run: `make test-emulator`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/server/orders/expire-orders.ts tests/integration/expire-orders.test.ts
git add src/server/orders/expire-orders.ts tests/integration/expire-orders.test.ts
git commit -m "fix(orders): keep expiring orders when one document is invalid"
```

---

### Task 16: Migração segura de rodar de novo

**Files:**
- Modify: `scripts/migrate-catalog.ts`, `scripts/lib/catalog-migration.ts`, `scripts/lib/catalog-migration.test.ts`, `scripts/lib/legacy-collections.ts`

**Interfaces:**
- Produces:
  - `uniqueSlugs(names: string[], taken?: Iterable<string>): string[]`, que evita slugs já usados.
  - O `--apply` só cria coleções que não existem e inclui `collections` no backup.

- [ ] **Step 1: Teste que reproduz**

Em `scripts/lib/catalog-migration.test.ts`:

```ts
  it('não repete slug de produto já migrado', () => {
    expect(uniqueSlugs(['Camiseta'], ['camiseta'])).toEqual(['camiseta-2'])
  })
```

(se `uniqueSlugs` numerar de outro jeito, ajuste a expectativa ao padrão que ele já usa para nomes repetidos).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit scripts/lib/catalog-migration.test.ts`
Expected: FAIL

- [ ] **Step 3: Corrigir**

Em `scripts/lib/catalog-migration.ts`, acrescentar o parâmetro `taken: Iterable<string> = []` a `uniqueSlugs`, e pré-carregar o conjunto de usados com ele antes de gerar os slugs novos.

Em `scripts/migrate-catalog.ts`:
- Os slugs dos produtos já migrados entram como `taken`: `const taken = snapshot.docs.filter((d) => isMigrated(d.data())).map((d) => String(d.get('slug')))`, depois `uniqueSlugs(names, taken)`.
- Ler as coleções antes de gravar: `const existing = await db.collection('collections').get()`. Acrescentar ao backup `{ products: [...], collections: existing.docs.map(...) }`.
- Só criar a coleção legada se não houver nenhum documento com o mesmo slug, nem pelo id nem pelo campo `slug`:

```ts
  const existingSlugs = new Set(existing.docs.map((d) => String(d.get('slug'))))
  for (const collection of LEGACY_COLLECTIONS) {
    // Rodar de novo não pode apagar o que o admin editou.
    if (!existingSlugs.has(collection.slug)) {
      batch.set(db.collection('collections').doc(collection.slug), collection)
    }
  }
```

- Mostrar no console quantas coleções foram puladas.

Em `scripts/lib/legacy-collections.ts`: trocar as datas `T00:00:00.000Z` de `launchedAt` por `T00:00:00-03:00`, que é meia-noite em São Paulo.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit scripts && npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write scripts
git add scripts
git commit -m "fix(scripts): make catalog migration safe to re-run"
```

---

### Task 17: Levar o catálogo para produção e checklist de lançamento

**Files:**
- Create: `scripts/catalog-transfer.ts`, `scripts/lib/catalog-transfer.ts`, `scripts/lib/catalog-transfer.test.ts`
- Modify: `package.json`, `Makefile`, `README.md`

**Interfaces:**
- Produces:
  - `serializeCatalog(docs: { collection: string; id: string; data: unknown }[]): string` e `parseCatalog(json: string): { collection: 'products' | 'collections' | 'settings'; id: string; data: Record<string, unknown> }[]`. As datas viram `{ __date: ISO }` na ida e voltam a ser `Date`; coleção fora da lista é recusada.
  - O `npm run catalog -- export <arquivo>` lê `products`, `collections` e `settings/store` do projeto do `.env.local`.
  - O `npm run catalog -- import <arquivo>` grava só os documentos que **não existem** no destino (usa `create` e pula os que já existem), e mostra o projeto de destino antes de gravar.
  - Make: `make catalog-export FILE=...` e `make catalog-import FILE=... ENV=.env.production.local`.

- [ ] **Step 1: Teste**

`scripts/lib/catalog-transfer.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseCatalog, serializeCatalog } from './catalog-transfer'

describe('catalog transfer', () => {
  it('ida e volta preserva datas', () => {
    const docs = [
      { collection: 'products', id: 'p1', data: { name: 'X', createdAt: new Date('2026-10-01T00:00:00Z') } },
    ]
    const back = parseCatalog(serializeCatalog(docs))
    expect(back).toEqual(docs)
    expect(back[0]?.data.createdAt).toBeInstanceOf(Date)
  })

  it('recusa coleção fora do catálogo', () => {
    expect(() =>
      parseCatalog(JSON.stringify([{ collection: 'orders', id: 'o1', data: {} }])),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run --project unit scripts/lib/catalog-transfer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar**

`scripts/lib/catalog-transfer.ts`:

```ts
// Imports relativos: roda no Vitest e no tsx, fora do Next.
const ALLOWED = ['products', 'collections', 'settings'] as const
type Allowed = (typeof ALLOWED)[number]
export type CatalogDoc = { collection: Allowed; id: string; data: Record<string, unknown> }

function encode(value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() }
  if (Array.isArray(value)) return value.map(encode)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]))
  }
  return value
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.__date === 'string') return new Date(record.__date)
    return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, decode(v)]))
  }
  return value
}

export function serializeCatalog(docs: { collection: string; id: string; data: unknown }[]): string {
  return JSON.stringify(docs.map((doc) => ({ ...doc, data: encode(doc.data) })), null, 2)
}

export function parseCatalog(json: string): CatalogDoc[] {
  const raw = JSON.parse(json) as { collection: string; id: string; data: unknown }[]
  return raw.map((doc) => {
    if (!ALLOWED.includes(doc.collection as Allowed) || !/^[A-Za-z0-9_-]{1,128}$/.test(doc.id)) {
      throw new Error(`Documento fora do catálogo: ${doc.collection}/${doc.id}`)
    }
    return { collection: doc.collection as Allowed, id: doc.id, data: decode(doc.data) as Record<string, unknown> }
  })
}
```

`scripts/catalog-transfer.ts`: inicializa o Admin SDK como o `migrate-catalog.ts` faz, com as mesmas variáveis e mensagens. Recebe `export <arquivo>` ou `import <arquivo>`:
- **export:** lê `products`, `collections` e `settings/store` (convertendo Timestamp em Date com o mesmo `toPlain` do outro script), grava o arquivo com `serializeCatalog` e mostra a contagem.
- **import:** mostra `Projeto de destino: <FIREBASE_PROJECT_ID>`. Para cada documento, tenta `create`; em ALREADY_EXISTS (código 6), conta como pulado. No fim, mostra criados e pulados.

`package.json`: dois scripts, porque o arquivo de env do import muda conforme o destino:

```json
"catalog-export": "tsx --env-file=.env.local scripts/catalog-transfer.ts export",
"catalog-import": "tsx scripts/catalog-transfer.ts import"
```

O `catalog-import` lê o env pelo `Makefile`: `ENV ?= .env.local` e `npx tsx --env-file=$(ENV) scripts/catalog-transfer.ts import "$(FILE)"`.

`Makefile`: alvos `catalog-export` (exige `FILE`) e `catalog-import` (exige `FILE`; `ENV` com padrão `.env.local`), com `##` de ajuda, no bloco "Operação".

`README.md`: nova seção `## Lançamento (checklist)`:

```markdown
## Lançamento (checklist)

1. Criar o projeto Firebase de produção e ativar Authentication (e-mail/senha e Google) com a política de senha: mínimo 8, máximo 128, exigir número, modo "exigir", sem forçar upgrade.
2. `npx firebase deploy --only firestore:rules,firestore:indexes --project <prod>`. Sem os índices, o cron de expiração, `/conta` e o filtro do admin quebram.
3. Variáveis na Vercel (produção): todas do `.env.example`, incluindo `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` e `CRON_SECRET`; credenciais reais do Mercado Pago e do Melhor Envio (token só com `shipping-calculate`).
4. Catálogo: `make catalog-export FILE=.backups/catalogo.json` (dev) e `make catalog-import FILE=.backups/catalogo.json ENV=.env.production.local`. As fotos apontam para o Cloudinary de teste: reenvie pelo admin na conta de produção antes de desativar a de teste.
5. Admin: entrar com o e-mail da loja (confirmado) e `make grant-admin EMAIL=...` com o `.env` de produção.
6. Webhook do Mercado Pago apontando para `https://<domínio>/api/webhooks/mercadopago` com o segredo em `MERCADOPAGO_WEBHOOK_SECRET`.
7. Resend com o domínio próprio verificado e `EMAIL_FROM` desse domínio.
```

Corrigir também a linha do README que diz que `make check` é "tudo o que o CI roda": o CI roda também `make lint-sh`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run --project unit scripts && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
npx prettier --write scripts README.md package.json
git add scripts package.json Makefile README.md
git commit -m "feat(scripts): add catalog export/import and a launch checklist"
```

---

### Task 18: Spec e revisão

- [ ] **Step 1: Registrar as decisões na spec**

Em `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`:
- Seção 4, `createOrder`, passo 5: trocar "Revalida o cupom: `active`, janela `startsAt`/`endsAt`, `minSubtotalCents`, `usedCount < maxUses`." por "Revalida o cupom e **reserva o uso** na mesma transação do pedido (`usedCount + 1`); a reserva volta quando o pedido expira ou é cancelado antes do pagamento. Pedido abaixo de R$ 1,00 é recusado."
- Seção 4, Webhook: trocar "`usedCount++` no cupom" por "o cupom já foi reservado; pedido `expired` pago depois reserva de novo (com alerta se passar do limite)". Acrescentar: "Pagamento que o MP não encontra (notificação de teste) é ignorado."
- Máquina de status: acrescentar `cancelled → refunded` (só pelo webhook do estorno).
- Seção 6, Decisões da Fase 5: acrescentar "Rastreio pode ser corrigido em pedidos enviados ou entregues; o e-mail sai de novo com o código novo." e "Admin exige e-mail verificado."

```bash
git add docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md
git commit -m "docs: record review fixes in spec"
```

- [ ] **Step 2: CI local**

Run: `make check`
Expected: verde

- [ ] **Step 3: Revisão independente**

Revisor (Agent, modelo mais capaz) com o diff do plano, a spec, este plano, a seção Review Focus e as linhas `Ruling:` do ledger. Corrigir os achados Critical e Important com teste que falha primeiro.

- [ ] **Step 4: Encerrar**

`superpowers:finishing-a-development-branch`. A branch fica como está; o merge na `main` só acontece com pedido do usuário.
