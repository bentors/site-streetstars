<div align="center">
  <img src="https://res.cloudinary.com/dmsvju9ca/image/upload/v1769730868/logo_fundopreto_y87j0h.png" alt="Street Stars Logo" width="200">

  # Street Stars — E-commerce

  ### Streetwear autêntico nascido em São Paulo.

  [Site ao Vivo](https://streetstars.vercel.app/) • [Reportar Bug](https://github.com/bentors/site-streetstars/issues)

</div>

---

## Sobre o Projeto

O **Street Stars** é um e-commerce de streetwear desenvolvido com foco em performance, segurança e experiência mobile-first. Como cofundador e desenvolvedor principal, o desafio foi construir uma plataforma que respira cultura urbana sem abrir mão de qualidade técnica — cobrindo desde a vitrine até o fluxo completo de pagamento, notificações e painel admin.

---

## Stack

### Front-end
| Ferramenta | Uso |
| :--- | :--- |
| React 18 + Vite | SPA com lazy loading e code splitting por rota |
| Tailwind CSS | Estilização utilitária e responsiva |
| Framer Motion | Animações e micro-interações |
| React Router v7 | Roteamento com guards de autenticação |
| react-helmet-async | SEO dinâmico com metatags e JSON-LD por página |
| react-ga4 | Google Analytics 4 com inicialização não-bloqueante |
| Vercel Speed Insights | Monitoramento de Web Vitals em produção |

### Back-end & Serviços
| Ferramenta | Uso |
| :--- | :--- |
| Firebase Auth | Autenticação de usuários e admin via Custom Claims JWT |
| Firestore | Produtos, usuários, endereços e pedidos |
| Vercel Serverless Functions | API segura: pagamento, frete, uploads e webhooks |
| Cloudinary | Upload assinado e entrega otimizada de imagens |
| Mercado Pago Checkout Pro | Processamento de pagamentos com webhook HMAC |
| Melhor Envio | Cálculo de frete PAC/SEDEX em tempo real |
| Resend | E-mails transacionais de confirmação de pedido |
| Upstash Redis | Rate limiting distribuído entre instâncias serverless |
| Vercel CDN | Deploy automático e cache imutável de assets |

---

## Funcionalidades

### Loja
- Catálogo com filtro por categoria, busca em tempo real e paginação
- Página de produto com galeria, variantes (tamanho e cor) e produtos relacionados
- Carrinho persistido em `localStorage` com TTL de 7 dias
- Otimização automática de imagens via Cloudinary (srcset responsivo, `f_auto`, `q_auto`)

### Checkout
- Fluxo completo: carrinho → endereço → revisão → pagamento
- Cálculo de frete PAC/SEDEX via Melhor Envio
- Pagamento via Mercado Pago Checkout Pro
- Acompanhamento de status do pedido em tempo real após a compra
- E-mail de confirmação automático após pagamento aprovado

### Área do Usuário
- Cadastro, login, recuperação de senha
- Gerenciamento de perfil, endereços salvos e histórico de pedidos

### Painel Admin
- CRUD completo de produtos com upload de imagens (capa + galeria)
- Dashboard de pedidos com badge de novos pedidos em tempo real
- Controle de visibilidade e destaque de produtos

---

## Arquitetura de Segurança

```
Browser (React SPA)
       │
       ├── Firebase Auth         → JWT com Custom Claims (admin)
       ├── Firestore             → Security Rules por coleção
       ├── Cloudinary CDN        → Upload restrito a admin autenticado
       │
       └── Vercel API Routes (/api/*)
                │
                ├── _authMiddleware.js   → verifica Firebase ID Token em todas as rotas
                ├── _rateLimiter.js      → sliding window via Upstash Redis (distribuído)
                ├── calculateShipping.js → protegido: exige auth
                ├── createPayment.js     → revalida preços do catálogo; nunca confia no cliente
                ├── mpWebhook.js         → verificação HMAC da assinatura do Mercado Pago
                └── signUpload.js        → restrito a admin (custom claim)
```

**Camadas de proteção aplicadas:**
- Preços sempre re-validados no servidor antes de criar preferência de pagamento
- `userId` extraído do token JWT, nunca do body da requisição
- Rate limiting: `createPayment` 5 req/min · `signUpload` 10 req/min · `calculateShipping` 30 req/min
- CSP sem `unsafe-inline` — inline scripts autorizados por hash SHA-256
- Guards de rota (`Private`, `PrivateUser`) carregados de forma síncrona — sem janela de acesso antes da verificação de auth
- HTML sanitizado antes de interpolar no template de e-mail transacional

---

## Estrutura do Projeto

```
/
├── api/                         # Vercel Serverless Functions
│   ├── _authMiddleware.js       # Verificação de Firebase ID Token
│   ├── _firebase.js             # Firebase Admin SDK
│   ├── _rateLimiter.js          # Rate limiting via Upstash Redis
│   ├── calculateShipping.js     # POST /api/calculateShipping
│   ├── createPayment.js         # POST /api/createPayment
│   ├── mpWebhook.js             # POST /api/mpWebhook
│   └── signUpload.js            # POST /api/signUpload (admin only)
│
├── scripts/
│   └── generate-sitemap.cjs    # Gera sitemap.xml dinamicamente no build
│
├── src/
│   ├── components/
│   │   ├── admin/               # ProductForm
│   │   ├── home/                # Hero, About, Collections, Manifesto
│   │   ├── layout/              # Header, Footer, CartDrawer, DefaultLayout
│   │   ├── shop/                # Shop, HeaderSearch
│   │   └── ui/                  # Logo, SEO, Loading, AuthLoading, ErrorBoundary
│   ├── context/
│   │   ├── AuthContext.jsx      # Sessão, perfil e isAdmin — listener único
│   │   └── CartContext.jsx      # Carrinho com TTL de 7 dias
│   ├── pages/
│   │   ├── admin/               # Dashboard, Login, NewProduct, EditProduct
│   │   ├── auth/                # UserLogin, UserRegister, ForgotPassword
│   │   ├── account/             # MyAccount
│   │   └── checkout/            # CheckoutAddress, CheckoutReview, OrderConfirmation
│   ├── routes/
│   │   ├── Private.jsx          # Guard admin — verifica custom claim
│   │   └── PrivateUser.jsx      # Guard usuário autenticado
│   ├── services/
│   │   ├── api.js               # Helper com auth header para Vercel Functions
│   │   ├── cloudinary.js        # Upload assinado com auth
│   │   └── firebase.js          # db (lite) + dbRealtime (onSnapshot) + auth
│   └── utils/
│       ├── analytics.js         # GA4 com requestIdleCallback
│       ├── image.js             # optimizeImage + generateSrcSet (Cloudinary)
│       └── validators.js        # Email, senha, força de senha, CEP, telefone
│
├── public/
│   ├── robots.txt
│   └── sitemap.xml              # Gerado automaticamente no build
├── firestore.rules              # Security Rules completas por coleção
└── vercel.json                  # Headers de segurança + rewrite de SPA
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

```bash
cp .env.example .env
```

### Front-end (`VITE_*`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_GA_TRACKING_ID=
```

### Servidor — Vercel Functions
```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MERCADOPAGO_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
MELHORENVIO_TOKEN=
MELHORENVIO_ORIGEM_CEP=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
ALLOWED_ORIGIN=
```

---

## Rodando Localmente

```bash
# Instalar dependências
npm install

# Iniciar front-end
npm run dev

# Iniciar servidor local de API (em outro terminal)
npm run dev:api
```

> As Vercel Functions rodam localmente via `api/_server.cjs` na porta `3001`.
> O Vite já está configurado com proxy para `/api → localhost:3001`.

---

## Deploy

Deploy automático via push na branch `main`. O script `generate-sitemap.cjs` roda automaticamente antes do `vite build`, garantindo que o `sitemap.xml` reflita os produtos ativos a cada deploy.

```bash
# Build de produção
npm run build:prod
```

---

## Documentação

| Arquivo | Conteúdo |
| :--- | :--- |
| `architecture.md` | Decisões técnicas, fluxos de segurança e diagrama da stack |
| `schema.md` | Estrutura completa do Firestore e regras de segurança |
| `roadmap.md` | Sprints concluídas e backlog futuro |
| `changelog.md` | Histórico de versões e mudanças |

---

## Fundadores

- **Bento Rangel** — Software Developer & Co-founder
- **Felipe dos Santos** — Designer & Co-founder

---

<div align="center">
  <p>Desenvolvido com ⚡ por Bento Rangel</p>
</div>