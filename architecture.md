# Arquitetura — Street Stars

## Visão Geral

SPA (Single Page Application) React com Firebase como backend-as-a-service e Vercel como plataforma de deploy.

---

## Stack e Decisões

### React + Vite (sem Next.js)
Escolha intencional para esse estágio. O catálogo é pequeno, o SEO é coberto via react-helmet-async com fallback estático no index.html, e a complexidade de SSR não se justifica agora. Migração para Next.js fica planejada para quando SEO orgânico virar prioridade crítica de crescimento.

### Firebase
Cobre autenticação, banco de dados e (futuramente) Cloud Functions para o backend do Mercado Pago. Evita manter infraestrutura de servidor separada nesse estágio.

### Firestore
Schema documentado em `SCHEMA.md`. Dados sensíveis de pedidos e usuários protegidos por Security Rules — atualização de status de pedido só via Admin SDK (Cloud Functions), nunca pelo client.

### Cloudinary
Gerenciamento e entrega de imagens com transformações automáticas (`f_auto`, `q_auto`, `srcSet` responsivo). Upload restrito ao painel admin autenticado.

### Vercel
Deploy automático via push na main. Headers de segurança (CSP, X-Frame-Options, Referrer-Policy) e cache imutável para assets estáticos configurados no `vercel.json`.

---

## Autenticação

Dois perfis distintos:

**Admin**
- Firebase Auth (email/senha)
- UID precisa existir na coleção `admins/{uid}` com `isAdmin: true`
- Verificado pelo Firestore nas Security Rules a cada operação de escrita

**Usuário**
- Firebase Auth (email/senha)
- Perfil salvo em `users/{uid}` no Firestore
- Rotas protegidas via guard no React Router

---

## Fluxo de Checkout (planejado — Sprint 3)

Cliente (React)
↓ autenticado via Firebase Auth
Firebase Cloud Function: createPayment
↓ cria preferência de pagamento
Mercado Pago API
↓ usuário paga na página hosted do MP
Mercado Pago Webhook
↓ notifica confirmação
Firebase Cloud Function: mpWebhook
↓ atualiza orders/{orderId}.status para "paid" via Admin SDK
Firestore
↓ cliente lê atualização em tempo real via onSnapshot
Cliente (React) — página de confirmação

---

## Imagens

Pipeline de otimização via `src/utils/image.js`:
- `optimizeImage(url, width)` — aplica `f_auto,q_auto,c_limit,dpr_auto` na URL do Cloudinary
- `generateSrcSet(url)` — gera srcSet responsivo para 400/800/1200/1600px
- Hero image com `<link rel="preload">` condicional por viewport no `index.html`

---

## Decisões Conscientes de Backlog

| Decisão | Motivo para adiar |
| :--- | :--- |
| TanStack Query | Catálogo pequeno, cache manual cobre o necessário agora |
| Paginação no Dashboard | Menos de 50 produtos no catálogo atual |
| Next.js / SSR | SEO coberto com helmet + fallback estático por enquanto |
| Upload assinado Cloudinary | Exige backend — entra junto com as Cloud Functions na Sprint 3 |
