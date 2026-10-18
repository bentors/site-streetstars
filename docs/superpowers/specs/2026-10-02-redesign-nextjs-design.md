# Street Stars — Redesign da aplicação (Next.js + Firebase)

- **Data:** 2026-10-02
- **Status:** aprovado em conversa, aguardando revisão da spec escrita
- **Branch de trabalho:** `refactor/nextjs`

## 1. Contexto e objetivo

A Street Stars é um e-commerce de streetwear **ainda não lançado**. A base atual (React + Vite SPA, Firebase, Vercel Functions) foi feita à mão e tem problemas estruturais. Os mais graves:

- O cliente grava o pedido direto no Firestore.
- O preço do frete vem do cliente.
- É possível adicionar itens a um pedido já pago.
- O webhook não é idempotente.
- O e-mail transacional sai do domínio de teste do Resend.
- O admin não consegue gerir pedidos.
- Há duplicação massiva de UI, o lint está quebrado e não existem testes.

O objetivo é **refazer a aplicação do zero** sobre uma arquitetura nova, mantendo a identidade visual e os serviços externos.

### Prioridades (decidem empates, nesta ordem)
1. Vender com segurança: dinheiro, pedidos e operação corretos.
2. Baixo custo de manutenção: poucos serviços, pouca infraestrutura, fácil de mexer.
3. SEO e performance.

### Decisões de produto
| Tema | Decisão |
|---|---|
| Situação | Não lançado. Pedidos e usuários atuais são descartados; só o catálogo é migrado. |
| Stack | Next.js (App Router) + Firebase, com todas as gravações no servidor (abordagem A). |
| Estoque | Não há. Produção sob demanda; o pedido passa por "em produção". |
| Compra | Sem conta (guest) ou com conta, à escolha do cliente. |
| Login | E-mail e senha + Google. |
| Pagamento | Mercado Pago Checkout Pro (redirect), só Pix e cartão (sem boleto), até 6 parcelas. |
| Frete | Correios PAC e SEDEX via Melhor Envio. |
| CPF | Obrigatório no checkout (necessário para a declaração de conteúdo do Melhor Envio). |
| Etiqueta de frete | Comprada manualmente no painel do Melhor Envio; o rastreio é digitado no admin. |
| Admin no lançamento | Pedidos, produtos (à venda e destaque), coleções, cupons e configurações da loja. |
| Parcelamento | Não exibido na vitrine (o Checkout Pro define as parcelas e os juros). |

### Fora do escopo (YAGNI)
- Controle de estoque, reservas e pré-venda com limite.
- Compra automática de etiqueta no Melhor Envio.
- Checkout transparente (Pix ou cartão dentro do site).
- Tela de gestão de admins (a claim é dada por script).
- Sentry ou APM; Husky e hooks locais.
- Relatórios e dashboards de vendas.

## 2. Arquitetura

Um único projeto **Next.js 16 (App Router) + React 19 + TypeScript 5.9 strict** na Vercel, substituindo o SPA Vite e as funções em `api/`. (TypeScript 7 fica para depois, quando o ecossistema Next/ESLint suportar o compilador nativo.)

**Regra central: só o servidor lê e grava o Firestore.** As regras do Firestore negam tudo, e o acesso é feito exclusivamente pelo Admin SDK. No navegador, o Firebase é usado apenas para autenticação (módulo `firebase/auth`).

- **Renderização:** home, produto, coleção e páginas legais são Server Components com ISR. As edições no admin chamam `revalidatePath`/`revalidateTag` na hora. Carrinho, checkout e formulários são Client Components.
- **Mutações:** Server Actions. Route Handlers só para chamadas externas: webhook do Mercado Pago e cron de expiração.
- **Sessão:** login no Firebase Auth (e-mail/senha ou Google popup) → `getIdToken()` → Server Action cria um *session cookie* (`createSessionCookie`) httpOnly. Admin = custom claim `admin: true`.
- **Compra sem conta:** o link `/pedido/<orderId>.<hmac>` é assinado com `ORDER_TOKEN_SECRET` (HMAC-SHA256) e comparado em tempo constante. Nada por pedido fica salvo, e o webhook consegue montar o link do e-mail. Trocar o segredo invalida os links já enviados.
- **Vínculo guest → conta:** quando o usuário entra com e-mail **verificado**, `createSession` vincula a `customer.uid` os pedidos com `customer.uid == null` e o mesmo e-mail. Contas do Google já vêm verificadas.
- **Imagens:** Cloudinary com upload assinado (somente admin) e entrega via `next/image` com loader do Cloudinary.
- **Serviços externos mantidos:** Firebase (Auth + Firestore), Vercel, Mercado Pago, Melhor Envio, Cloudinary, Resend, Upstash Redis (rate limit), ViaCEP.

## 3. Modelo de dados (Firestore)

Convenções:
- Dinheiro em **centavos inteiros** (`*Cents`).
- Timestamps do servidor.
- Pedidos guardam uma **cópia (snapshot)** dos dados no momento da compra.
- Nada é apagado de verdade: produtos e coleções usam `status`.

```
products/{id}
  slug                 string, único (URL /produto/[slug])
  name, description, category
  priceCents           int > 0
  weightGrams          int > 0
  productionDays       int >= 0
  sizes                string[]
  colors               { name, hex, image | null }[]   (foto da cor; existia no app antigo)
  images               { url, publicId, alt }[]   (a primeira é a capa)
  highlights           string[]
  sizeGuide            { columns: string[], rows: { size, values: string[] }[] } | null
  collectionIds        string[]
  status               'draft' | 'active' | 'archived'
  featured             bool
  featuredOrder        int | null
  createdAt, updatedAt

collections/{id}
  slug, title, shortDescription
  body                 string[]  (parágrafos)
  credits              { photo, direction, styling }
  coverImage, hoverImage, gallery: string[]
  status               'draft' | 'published'
  order                int
  launchedAt

users/{uid}
  name, email, phone, cpf
  marketingConsent     { value: bool, at: Timestamp }
  addresses            { id, label, cep, street, number, complement,
                         neighborhood, city, state, isDefault }[]
                       (no máximo um isDefault, garantido no servidor)
  createdAt, updatedAt

orders/{id}
  number               'SS-1042' (sequencial via counters/orders em transação)
  idempotencyKey       string (gerada pela página de checkout)
  customer             { uid | null, email, name, phone, cpf }
  items                { productId, slug, name, image, size, color,
                         unitPriceCents, qty, lineTotalCents }[]
  shippingAddress      { cep, street, number, complement, neighborhood, city, state }
  shipping             { serviceId, name, company, priceCents,
                         deliveryDays, productionDays }
  coupon               { code, type, value, discountCents } | null
  totals               { subtotalCents, discountCents, shippingCents, totalCents }
  status               ver máquina de status
  statusHistory        { status, at, by: 'system' | 'webhook' | uid, note?, paymentId? }[]
  payment              { preferenceId, paymentId, status, method,
                         paidAmountCents, paidAt } (campos nulos até existirem)
  tracking             { carrier, code, url } | null
  notifications        { confirmationSentAt, shippedSentAt, adminAlertSentAt }
                       (adminAlertSentAt = e-mail de "novo pedido pago" para a loja)
  createdAt, updatedAt, expiresAt

coupons/{CODE}                         (id = código em maiúsculas)
  type                 'percent' | 'fixed'
  value                int (percentual 1–100 ou centavos)
  minSubtotalCents     int | null
  startsAt, endsAt     Timestamp | null
  maxUses              int | null
  usedCount            int
  active               bool

counters/orders        { last: int }

settings/store
  whatsapp, email, instagram, cnpj, address
  originCep
  package              { heightCm, widthCm, lengthCm }
```

Índices previstos:
- `products(status, featured, featuredOrder)` e `products(status, createdAt)`.
- `orders(status, createdAt desc)`, `orders(customer.uid, createdAt desc)`, `orders(customer.email, customer.uid)` e `orders(idempotencyKey)`.

### Máquina de status do pedido

```
pending_payment ─► paid ─► in_production ─► shipped ─► delivered
      │              ├──► cancelled
      │              └──► refunded
      ├──► expired      (cron: 48h sem pagamento; ainda pode ir para paid)
      └──► cancelled    (admin)
```

- Implementada como função pura `canTransition(from, to)` em `server/domain/order-status.ts`. Qualquer transição fora da tabela é rejeitada.
- `expired` e `pending_payment` aceitam ir para `paid` se o pagamento aprovado chegar depois da expiração.
- Status nunca regridem: uma notificação "recusado" posterior a "aprovado" é ignorada.

## 4. Fluxo de compra

### Carrinho
- O `localStorage` guarda apenas `{ productId, size, color, qty }`, sem preço.
- A Server Action `priceCart(lines)` devolve as linhas com nome, imagem e preço atuais, e remove o que não estiver `active` ou tiver tamanho ou cor inválidos.
- `qty` fica entre 1 e 10 por linha.

### Checkout (`/checkout`, página única em blocos)
1. **Contato:** e-mail, nome, telefone, CPF (validado). Logado: pré-preenche e-mail, nome, telefone e CPF; escolhe ou salva endereços da conta (Fase 4).
2. **Endereço:** o CEP preenche o resto via ViaCEP.
3. **Frete:** `quoteShipping(cep, lines)` consulta o Melhor Envio com o peso total e as medidas de `settings/store.package`. O prazo exibido é `max(productionDays) + deliveryDays`.
4. **Cupom:** `previewCoupon(code, lines)` só calcula e exibe o desconto.
5. **Revisar → Pagar**, que chama `createOrder`.

### `createOrder(input)` (Server Action)
1. Rate limit por IP e por e-mail; validação zod da entrada.
2. Se existe pedido com o mesmo `idempotencyKey` → devolve o link de pagamento desse pedido (gerando nova preferência se necessário). Não cria outro.
3. Carrega os produtos do Firestore. Recusa se algum não estiver `active` ou se tamanho ou cor não existirem.
4. Calcula o subtotal com `priceCents` do catálogo.
5. Revalida o cupom: `active`, janela `startsAt`/`endsAt`, `minSubtotalCents`, `usedCount < maxUses`.
6. **Cota o frete de novo** e usa o preço do servidor para o `serviceId` escolhido. Se o serviço não estiver disponível, devolve erro.
7. Calcula os totais com `server/domain/pricing.ts`.
8. Transação: incrementa `counters/orders` e grava o pedido `pending_payment`, com `expiresAt = agora + 48h`, `statusHistory` inicial (o link de acesso é derivado do id).
9. Cria a preferência no Mercado Pago (itens, frete, desconto, `external_reference = orderId`, `notification_url`, `back_urls = /pedido/[token]`) e salva o `preferenceId`.
10. Devolve `{ initPoint }`. O cliente limpa o carrinho e redireciona.

Se o passo 9 falhar, o pedido fica `pending_payment` e a resposta é um erro; uma nova tentativa com a mesma chave reaproveita o pedido.

### Webhook (`POST /api/webhooks/mercadopago`)
1. Valida a assinatura HMAC (`x-signature`, `x-request-id`, segredo). Responde 401 se inválida.
2. Ignora (200) tudo que não for evento de pagamento.
3. Busca o pagamento na **API do Mercado Pago** pelo id, que é a fonte da verdade.
4. Carrega o pedido por `external_reference` e, numa transação:
   - `approved` com `transaction_amount` igual a `totalCents / 100` → `paid`, preenche `payment`, `statusHistory`, `usedCount++` no cupom.
   - `approved` com valor divergente → mantém o status, registra no histórico e dispara o alerta ao admin.
   - `rejected`/`cancelled` com o pedido pendente → apenas registra o `payment.status`. O cliente pode tentar de novo.
   - `refunded`/`charged_back` com o pedido `paid` ou posterior → `refunded`.
   - Evento repetido ou transição inválida → nada muda.
5. Depois da transação: envia o e-mail de confirmação ao cliente e o de "novo pedido" ao admin se `notifications.*SentAt` estiverem vazios, e grava as datas.
6. Responde 200 quando processou ou ignorou, e 500 em erro temporário, para o MP reenviar.

### Pós-pagamento
- `/pedido/[token]` mostra status, itens, totais, endereço e rastreio, sempre lidos do servidor. Enquanto `pending_payment`, faz `router.refresh()` periódico.
- "Tentar pagar novamente" (pedido pendente) gera nova preferência para o mesmo pedido.
- **Cron** (`/api/cron/expirar-pedidos`, Vercel Cron diário, protegido por `CRON_SECRET`): marca como `expired` os pedidos `pending_payment` com `expiresAt` vencido.

## 5. Conta do cliente

- **Rotas:** `/entrar`, `/cadastro`, `/recuperar-senha` (e-mail nativo do Firebase) e `/conta`.
- **Cadastro:** nome, e-mail, senha (mín. 8, letra e número), aceite dos termos e consentimento de marketing opcional (com data). Envia o e-mail de verificação.
- **`/conta`:**
  - Pedidos: lista com link para o detalhe.
  - Endereços: CRUD, um único padrão.
  - Perfil: nome, telefone, CPF e consentimento.
  - Segurança: troca de senha, só para contas com senha.
- Todas as ações usam `requireUser()` e só tocam o documento do próprio uid.

### Decisões da Fase 4 (2026-10-18)
- **Vínculo guest → conta** acontece dentro de `createSession` sempre que o ID token traz `email_verified` (login com Google, login depois de confirmar o e-mail). Falha no vínculo não impede o login.
- **Cookie desatualizado:** o session cookie guarda a verificação do momento do login. O aviso em `/conta` tem "Já confirmei", que consulta o Firebase e pede um novo login (`/entrar?confirmado=1`).
- **Sem reenvio de verificação nesta fase:** sem e-mail verificado, o cliente só perde o vínculo automático de pedidos antigos. Reenviar fica para quando o domínio do Resend existir.
- **Troca de senha** no navegador: reautentica com a senha atual, `updatePassword` e entra de novo com a senha nova para gerar o cookie (a troca revoga todo login anterior a ela, inclusive o token renovado com `getIdToken(true)`; comprovado no emulador). Se algo falhar depois da troca, a tela diz que a senha mudou e pede novo login.
- **Endereços:** até 10 por conta, sempre exatamente um padrão (regra pura em `server/domain/addresses.ts`).
- **Checkout logado:** pré-preenche com o endereço padrão, permite escolher entre os salvos e tem "Salvar este endereço na minha conta" (marcado por padrão quando não há endereços). Telefone e CPF vão para o perfil só se estiverem vazios. Salvar dados da conta nunca derruba o pedido.
- **Rotas:** `/conta` (pedidos, com link para `/pedido/[token]`), `/conta/enderecos`, `/conta/perfil`, `/conta/seguranca`, dentro do grupo `(loja)`.

## 6. Admin (`/admin`)

Acesso: o proxy (`src/proxy.ts`, nome do antigo middleware no Next 16) redireciona quem não está logado, e **toda** Server Action do admin chama `requireAdmin()`, que confere a claim no session cookie.

- **Pedidos**
  - Lista filtrável por status, com busca por número ou e-mail e indicador de pagos ainda não vistos.
  - Detalhe com itens, cliente, CPF, endereço (botão copiar), totais, pagamento e histórico.
  - Ações limitadas às transições válidas. "Enviado" exige `tracking.code` e dispara o e-mail com o rastreio.
  - Cancelamento e estorno são registrados com observação; o reembolso financeiro é feito no painel do MP.
- **Produtos**
  - Lista com status e destaque.
  - Formulário: upload assinado para o Cloudinary, ordenação de imagens, destaques, tamanhos, cores, editor de guia de medidas, coleções, peso, dias de produção, preço e slug.
  - Ações: ativar, arquivar, destacar e ordenar.
  - Salvar revalida as páginas da loja.
- **Coleções:** CRUD, galeria, publicar ou ocultar, ordem e vínculo com produtos.
- **Cupons:** criar, editar validade e limite, desativar e ver `usedCount`.
- **Configurações:** edita `settings/store`.
- **Auditoria:** `statusHistory.by` registra o uid do admin.
- **Concessão de admin:** `scripts/grant-admin.ts <email>`.

### Decisões da Fase 5 (2026-10-18)
- **Rotas:** `/admin` redireciona para `/admin/pedidos`; `/admin/pedidos/[id]`, `/admin/produtos` (+ `novo`, `[id]`), `/admin/colecoes` (+ `novo`, `[id]`), `/admin/cupons`, `/admin/configuracoes`.
- **Pagos não vistos:** campo `orders.adminSeenAt`, marcado quando o admin abre o detalhe (por efeito no navegador, para o prefetch não contar como visto). O número aparece na aba Pedidos.
- **Transições do admin:** só `in_production`, `shipped`, `delivered`, `cancelled` e `refunded`, filtradas por `canTransition`. "Enviado" grava `tracking` (transportadora do frete escolhido e link do Melhor Rastreio) e envia o e-mail uma vez (`notifications.shippedSentAt` + chave de idempotência). Se o e-mail falhar, o status muda mesmo assim e o detalhe oferece "Reenviar e-mail de envio".
- **Busca de pedidos:** número (`1042` ou `SS-1042`) ou e-mail exato, até 100 resultados.
- **Produto:** o formulário cobre todos os campos; o guia de medidas é um texto com `;` (1ª linha = colunas). Destaque e ordem ficam na lista. O vínculo com coleções é marcado no produto.
- **Datas digitadas no admin** usam o horário de São Paulo (offset fixo -03:00).
- **Cupom:** código, tipo e valor não mudam depois de criado; edição só de validade, limite, pedido mínimo e ativo.
- **Upload:** assinado no servidor (`folder=streetstars`) e enviado direto do navegador ao Cloudinary. A conta atual é a de teste; a produção terá conta nova.
- **E2E (Playwright): adiado** para depois do lançamento.

## 7. Organização do código

```
src/
  app/
    (loja)/      page, produto/[slug], colecao/[slug], legal/[slug],
                 checkout, pedido/[token]
    (auth)/      entrar, cadastro, recuperar-senha
    conta/       pedidos, enderecos, perfil, seguranca
    admin/       pedidos, produtos, colecoes, cupons, configuracoes
    api/         webhooks/mercadopago, cron/expirar-pedidos
  features/      catalog, cart, checkout, orders, account, admin
                 (componentes do domínio + actions.ts)
  server/        (todo arquivo importa 'server-only')
    domain/        pricing, order-status, coupons, shipping-estimate  ← puro, sem I/O
    db/            firestore admin + repositórios tipados por coleção
    integrations/  mercadopago, melhorenvio, resend, cloudinary, viacep
    auth/          session, requireUser, requireAdmin
    ratelimit.ts
  components/ui/ Button, Field, Select, Checkbox, Modal, Drawer, Toast,
                 Badge, Spinner, Container
  lib/           money, cpf, cep, phone, env (zod)
  emails/        order-confirmation, order-shipped, admin-new-order, admin-alert
                 (templates HTML com escape automático; sem react-email)
content/legal/   termos-de-uso.ts, politica-de-privacidade.ts, trocas-e-devolucoes.ts
                 (texto puro com marcadores {{whatsapp}}, {{cnpj}}, {{email}}, {{instagram}},
                 {{siteHost}} preenchidos com settings/store)
scripts/         grant-admin.ts, migrate-catalog.ts
```

Regras:
- **Direção das dependências:** `app → features → server → (db | integrations)`. `server/domain` não importa nada de I/O.
- **Erros esperados:** Server Actions devolvem `Result<T> = { ok: true, data: T } | { ok: false, code: string, message: string }`.
- **Variáveis de ambiente:** validadas por zod em `lib/env.ts`. A aplicação não sobe se faltar alguma. `.env.example` versionado.
- **`NEXT_PUBLIC_*`:** apenas config do Firebase Auth, ID do GA4 e nome da conta Cloudinary.
- **Visual:** identidade atual (preto, maiúsculas, itálico, contorno) vira tokens do tema Tailwind v4 e componentes `ui/`. Modal e Drawer usam o `<dialog>` nativo (foco, Escape e backdrop prontos) com transições CSS; Framer Motion só entra se alguma animação exigir.
- **Fontes:** Inter e Space Grotesk carregadas por `next/font`.

## 8. Erros e observabilidade

- Mensagens ao usuário em português, sem detalhes internos.
- `error.tsx` por segmento (loja, conta, admin) e `not-found.tsx`.
- Toda chamada externa tem timeout (`AbortSignal.timeout`). Falha do Melhor Envio → "frete indisponível, tente novamente". Falha do MP → pedido pendente reaproveitável.
- Logs estruturados (`orderId`, `paymentId`, ação) nos logs da Vercel.
- E-mail de alerta ao admin em: valor pago divergente e pagamento aprovado em pedido cancelado ou já pago. Falhas do webhook ficam nos logs da Vercel (o MP reenvia).

## 9. Segurança

- `firestore.rules`: `allow read, write: if false` em tudo.
- Session cookie `httpOnly`, `secure`, `sameSite=lax`, com expiração de 5 dias.
- Server Actions protegidas pela checagem de origem do Next.
- `requireAdmin()` em toda ação do admin, além do proxy.
- Rate limit (Upstash) em `createOrder`, `quoteShipping`, `previewCoupon` e nas ações de autenticação.
- CSP estática em `next.config.ts`: apenas `self`, Mercado Pago (redirect), Google Auth (`apis.google.com`, `*.firebaseapp.com`, `accounts.google.com`), Cloudinary e GA4. Não usamos nonce porque ele obriga toda página a ser renderizada a cada requisição e anularia o ISR (prioridade de SEO e performance); por isso `script-src` inclui `'unsafe-inline'`, exigido pelos scripts inline do Next. A mitigação de XSS vem de o React escapar a saída e de nunca injetarmos HTML de usuário (JSON-LD é serializado com `<` escapado).
- Link de pedido: `<orderId>.<hmac>` com HMAC-SHA256 de `ORDER_TOKEN_SECRET`, comparado em tempo constante (nada por pedido fica salvo).
- Toda entrada validada com zod; e-mails gerados por templates HTML com escape automático de todo valor interpolado.
- LGPD: consentimento com data; páginas legais usam dados reais de `settings/store`.

## 10. Testes

- **Unitários (Vitest), cobertura alta:** `pricing`, `coupons`, `order-status`, `shipping-estimate`, `money`, `cpf`, `cep`.
- **Integração (Vitest + Firestore Emulator, MP, Melhor Envio e Resend simulados com vi.mock (clientes testados à parte com fetch simulado)):**
  - `createOrder` ignora preço de frete vindo do cliente;
  - recusa produto não ativo;
  - mesma `idempotencyKey` devolve o mesmo pedido;
  - cupom expirado ou esgotado é recusado.
  - Webhook: assinatura inválida → 401; evento duplicado não altera nada; valor divergente não marca `paid`; "recusado" após "aprovado" não regride; e-mail enviado uma única vez.
- **E2E (Playwright):** compra sem conta até o redirect ao MP; admin marca o pedido como enviado com rastreio. **Adiado para depois do lançamento** (decisão de 2026-10-18); até lá, unitários, componentes e emulador cobrem os fluxos.
- **CI (GitHub Actions):** lint, typecheck, unitários, integração com emulador e build em todo push; E2E em PRs.
- Desenvolvimento das regras de `server/domain` e das ações de dinheiro em TDD.

## 11. Ambientes e entrega

- **Firebase:** o projeto existente `street-stars-system` passa a ser o de **desenvolvimento** (perfis, pedidos e `admins` de teste foram apagados em 2026-10-02; `products` mantido para a migração; contas do Auth mantidas). Um projeto de **produção limpo** será criado no lançamento. Testes automatizados usam o emulador (`demo-streetstars`).
- **Vercel:** preview por branch com credenciais de sandbox do Mercado Pago; produção com credenciais reais.
- **Resend:** domínio próprio verificado antes do lançamento; o domínio de teste não é usado.
- **Variáveis:** as integrações (Mercado Pago, Melhor Envio, Resend, `CRON_SECRET`) são obrigatórias quando `VERCEL_ENV=production`. Preview e build local funcionam sem elas.
- **Migração:** `scripts/migrate-catalog.ts` converte os produtos atuais e as coleções de `src/data/collections.js` para o novo modelo (preço em centavos, slug, status, imagens). Pedidos e usuários atuais são descartados.
- O código novo substitui o antigo dentro da própria branch `refactor/nextjs`. O merge na `main` acontece só ao final, após revisão completa contra a `main`.

### Fases (cada uma entrega algo funcionando)
1. **Fundação:** projeto Next.js, TypeScript, Tailwind v4, lint e CI, `lib/env`, design system `ui/`, Firebase Admin + repositórios, sessão e auth (e-mail + Google), regras "nega tudo", script de admin.
2. **Loja:** home, produto, coleção, páginas legais, SEO (metadata, JSON-LD, sitemap e robots dinâmicos), carrinho e migração do catálogo.
3. **Checkout e pagamento:** frete, cupom, `createOrder`, Mercado Pago, webhook, `/pedido/[token]`, e-mails e cron de expiração.
4. **Conta do cliente:** cadastro, verificação, vínculo de pedidos, endereços, perfil e segurança.
5. **Admin:** pedidos, produtos, coleções, cupons e configurações.

## 12. Pendências do negócio (não bloqueiam o desenvolvimento)

- Número real de WhatsApp, CNPJ e endereço da empresa (entram em `settings/store`).
- Domínio próprio para o site e para o Resend.
- Credenciais de produção: Mercado Pago, Melhor Envio, Cloudinary, Upstash.
- Revisão jurídica do texto das páginas legais.
- Nova conta do Cloudinary para produção (a atual vira a de teste) e novo upload das fotos do catálogo nela.
