# Arquitetura — Street Stars

## Visão Geral

SPA React (Vite) servida pela Vercel CDN. Back-end sem servidor: Vercel Serverless Functions
para operações sensíveis, Firebase Auth + Firestore para dados, Cloudinary para imagens.

```
Browser (React SPA)
       │
       ├── Firebase Auth         → autenticação de usuários e admin
       ├── Firestore (lite)      → catálogo, pedidos, endereços (leituras simples)
       ├── Firestore (completo)  → listeners em tempo real via onSnapshot (Dashboard, OrderConfirmation)
       ├── Cloudinary CDN        → entrega otimizada de imagens
       │
       └── Vercel API Routes (/api/*)
                │
                ├── _authMiddleware.js   → verifica Firebase ID Token em todas as rotas
                ├── _rateLimiter.js      → rate limiting distribuído via Upstash Redis
                ├── calculateShipping.js → Melhor Envio (PAC/SEDEX)
                ├── createPayment.js     → Mercado Pago Checkout Pro
                ├── mpWebhook.js         → recebe eventos de pagamento do MP
                └── signUpload.js        → assina uploads autenticados para Cloudinary (apenas admin)
```

---

## Por que SPA e não Next.js?

Escolha intencional para esse estágio. O catálogo é pequeno, o SEO é coberto via
`react-helmet-async` com sitemap dinâmico gerado no build, e a complexidade de SSR não
se justifica agora. Migração para Next.js está no backlog para quando SEO orgânico de
produto virar prioridade crítica de crescimento.

---

## Camadas de Segurança

### Autenticação e Autorização

| Camada | Mecanismo |
|---|---|
| Rotas admin (front-end) | `Private.jsx` verifica custom claim `admin === true` via `getIdTokenResult()` — sem leitura adicional ao Firestore |
| Rotas de usuário (front-end) | `PrivateUser.jsx` verifica sessão Firebase ativa |
| API Routes (back-end) | `_authMiddleware.js` verifica e decodifica o ID Token via Firebase Admin SDK |
| Upload de imagens | `signUpload.js` exige custom claim `admin === true` — usuários comuns não podem fazer upload |
| Firestore | Security Rules com whitelist por uid e custom claim — arquivo `firestore.rules` na raiz |

> Custom claims são setadas via script `scripts/setAdminClaim.js` usando Firebase Admin SDK.
> O usuário precisa fazer logout e login após a claim ser setada para o JWT atualizar.

### Fluxo de Token nas API Routes

```
Front-end
  1. auth.currentUser.getIdToken()  → obtém JWT do Firebase
  2. fetch('/api/...', { headers: { Authorization: 'Bearer <token>' } })

Back-end (_authMiddleware.js)
  3. admin.auth().verifyIdToken(token)  → valida assinatura e expiração
  4. decodedToken.uid  → uid confiável, não manipulável pelo cliente
```

### Validação de Preços (createPayment.js)

O servidor **nunca** confia nos preços enviados pelo cliente. O fluxo é:

1. Cliente envia apenas `orderId`
2. Servidor busca itens do pedido no Firestore
3. Servidor busca preço atual de cada produto no catálogo
4. Servidor recalcula total e atualiza o pedido antes de criar a preferência MP

### Rate Limiting

Implementado em `_rateLimiter.js` com Upstash Redis (`@upstash/ratelimit`):

- `createPayment`: 5 req/min por IP
- `signUpload`: 10 req/min por IP
- `calculateShipping`: 30 req/min por IP

Algoritmo `slidingWindow` — estado persiste entre instâncias serverless via Redis.
Fallback gracioso: se o Redis estiver indisponível, loga o erro e libera o request.

---

## Headers de Segurança HTTP (vercel.json)

| Header | Valor | Proteção |
|---|---|---|
| `Content-Security-Policy` | whitelist de origens | XSS, injeção de script |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Vazamento de URL |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Acesso indevido a hardware |

---

## Decisões Técnicas

| Decisão | Alternativa Considerada | Motivo da Escolha |
|---|---|---|
| Firebase Auth + Custom Claims para admin | Coleção `admins/` no Firestore | Claims verificadas no JWT — não exigem leitura adicional ao banco |
| `firebase/firestore/lite` no front-end (padrão) | SDK completo em todos os arquivos | 30% menor; `onSnapshot` isolado em `dbRealtime` apenas onde necessário |
| `dbRealtime` exportado do `firebase.js` | Instância local em cada componente | Instância única centralizada — evita bundle duplicado do SDK completo |
| Cloudinary com assinatura via servidor | Upload direto com preset público | `API_SECRET` nunca exposto; upload requer autenticação de admin |
| Upstash Redis para rate limiting | Map em memória por instância | Estado distribuído — funciona corretamente em ambiente serverless multi-instância |
| Sitemap gerado no build (`scripts/generate-sitemap.cjs`) | Sitemap estático manual | Produtos novos aparecem automaticamente a cada deploy |
| react-helmet-async para SEO | Next.js SSR | Evita rewrite completo da stack; sitemap dinâmico cobre indexação de produtos |
| Resend para e-mail transacional | Firebase Extensions / SendGrid | SDK simples, plano gratuito generoso, fácil customização do HTML |
| Mercado Pago Checkout Pro | Checkout Transparente | Menor esforço de conformidade com PCI DSS; MP absorve dados de cartão e CPF |

---

## Estrutura de Pastas

```
/
├── api/                         # Vercel Serverless Functions
│   ├── _authMiddleware.js       # Verifica Firebase ID Token (compartilhado)
│   ├── _firebase.js             # Firebase Admin SDK (compartilhado)
│   ├── _rateLimiter.js          # Rate limiting distribuído via Upstash Redis
│   ├── _server.cjs              # Servidor local de desenvolvimento (não deployado)
│   ├── calculateShipping.js     # POST /api/calculateShipping
│   ├── createPayment.js         # POST /api/createPayment
│   ├── mpWebhook.js             # POST /api/mpWebhook
│   ├── signUpload.js            # POST /api/signUpload (apenas admin)
│   └── package.json             # Dependências exclusivas do back-end
│
├── scripts/
│   └── generate-sitemap.cjs    # Gera public/sitemap.xml antes do build
│
├── src/
│   ├── components/
│   │   ├── admin/               # ProductForm (CRUD de produtos)
│   │   ├── home/                # Hero, About, Collections, Manifesto
│   │   ├── layout/              # Header, Footer, CartDrawer, FloatingAction
│   │   ├── shop/                # HeaderSearch, Shop
│   │   └── ui/                  # Logo, SEO, Loading, ErrorBoundary, AuthLoading
│   ├── context/
│   │   ├── AuthContext.jsx      # Sessão do usuário + perfil Firestore
│   │   └── CartContext.jsx      # Carrinho com persistência em localStorage
│   ├── data/                    # Dados estáticos (coleções, categorias, constantes)
│   ├── pages/
│   │   ├── account/             # MyAccount
│   │   ├── admin/               # Dashboard, Login, NewProduct, EditProduct
│   │   ├── auth/                # UserLogin, UserRegister, ForgotPassword
│   │   └── checkout/            # CheckoutAddress, CheckoutReview, OrderConfirmation
│   ├── routes/
│   │   ├── Private.jsx          # Guard de rota admin (custom claim)
│   │   └── PrivateUser.jsx      # Guard de rota de usuário autenticado
│   ├── services/
│   │   ├── api.js               # Chamadas às Vercel Functions (com auth header)
│   │   ├── cloudinary.js        # Upload assinado (com auth header)
│   │   └── firebase.js          # Inicialização Firebase — exporta db (lite) e dbRealtime (completo)
│   └── utils/
│       ├── analytics.js         # GA4 inicializado com requestIdleCallback (não bloqueia LCP)
│       ├── format.js            # formatCurrency
│       ├── image.js             # optimizeImage, generateSrcSet (Cloudinary)
│       ├── ScrollToTop.jsx      # Reset de scroll na navegação
│       ├── scrollToSection.js   # Scroll suave para seções da home
│       └── validators.js        # validateEmail, validatePassword, passwordStrength,
│                                #   formatPhone, formatCEP
│
├── public/
│   ├── robots.txt               # Aponta para /sitemap.xml
│   └── sitemap.xml              # Gerado automaticamente no build
├── firestore.rules              # Regras de segurança do Firestore
├── vercel.json                  # Headers de segurança e rewrite de SPA
├── vite.config.js               # Proxy de dev, chunk splitting, CSP local
└── tailwind.config.js           # Configuração do Tailwind
```

---

## Deploy

Deploy automático via push na `main`. O script `generate-sitemap.cjs` roda antes do
`vite build`, garantindo que o `sitemap.xml` reflita os produtos ativos a cada deploy.
Headers de segurança (CSP, X-Frame-Options, Referrer-Policy) e cache imutável para
assets estáticos configurados no `vercel.json`.

Variáveis de ambiente necessárias no painel da Vercel:

- Firebase: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Firebase Admin (sitemap): `FIREBASE_SERVICE_ACCOUNT_JSON`
- Cloudinary: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Mercado Pago: `MERCADOPAGO_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- Melhor Envio: `MELHORENVIO_TOKEN`, `MELHORENVIO_ORIGEM_CEP`
- Upstash Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- App: `ALLOWED_ORIGIN` (ex: `https://streetstars.vercel.app`)
- E-mail: `RESEND_API_KEY`