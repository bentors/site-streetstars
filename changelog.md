# Changelog — Street Stars

## [1.5.0] — 2026
### Segurança
- `mpWebhook.js`: função `escapeHtml()` adicionada — sanitiza todos os valores de usuário antes de interpolar no template HTML do e-mail transacional, prevenindo HTML/CSS injection
- `vercel.json`: `unsafe-inline` removido de `script-src` e `style-src` no CSP — substituído por hashes SHA-256 dos blocos inline do `index.html` (loader + `removeLoader`); qualquer script inline não autorizado é bloqueado pelo browser

### Arquitetura
- `AuthContext.jsx`: `isAdmin` adicionado ao estado e exposto no `value` do contexto — claims e perfil buscados em paralelo via `Promise.all` no único listener `onAuthStateChanged`
- `Private.jsx`: listener `onAuthStateChanged` próprio removido — consome `{ loading, isAdmin }` diretamente do `AuthContext`
- `PrivateUser.jsx`: listener `onAuthStateChanged` próprio removido — consome `{ loading, isAuthenticated }` diretamente do `AuthContext`; app passa de 3 para 1 listener WebSocket simultâneo com o Firebase
- `CartContext.jsx`: TTL de 7 dias adicionado ao carrinho persistido em `localStorage` — itens salvos há mais de 7 dias são descartados na inicialização; compatibilidade retroativa com formato legado (array puro) mantida
- `Dashboard.jsx`: paginação com cursor implementada nos produtos (`limit(20)` + `startAfter`) — carregamento sob demanda via botão "Carregar mais"
- `Dashboard.jsx`: `onSnapshot` de pedidos limitado a `limit(30)` — elimina tráfego desnecessário de pedidos históricos a cada atualização
- `Dashboard.jsx`: `alert()` e `confirm()` nativos substituídos por toast inline e dialog de confirmação com visual consistente com o painel admin

## [1.4.0] — 2026
### Segurança
- `signUpload` corrigido: `requireAuth` substituído por `requireAdmin` — qualquer usuário autenticado podia fazer upload para o Cloudinary da empresa
- CPF removido do cadastro, checkout e páginas legais — delegado ao Checkout Pro do Mercado Pago (conformidade LGPD)
- `firestore.rules` adicionado ao repositório com regras completas: `isAdmin`, `isOwner`, validação de schema por coleção
- Rate limiter migrado de memória para Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`) — estado agora persiste entre instâncias serverless
- Algoritmo `slidingWindow` no rate limiter — elimina brecha de boundary entre janelas fixas
- `calculateShipping`, `createPayment`, `signUpload`: `await` adicionado na chamada do rate limiter (sem await, a Promise era sempre truthy e o limite nunca funcionava)

### Arquitetura
- `AuthLoading.jsx` extraído como componente compartilhado — elimina duplicação entre `Private.jsx` e `PrivateUser.jsx`
- `firebase.js`: exporta `dbRealtime` (SDK completo) além de `db` (lite) — instância centralizada para `onSnapshot`
- `Dashboard.jsx`: instância `dbFull` local removida — usa `dbRealtime` do `firebase.js`
- `Dashboard.jsx`: imports duplicados de `auth` e `db` removidos
- `OrderConfirmation.jsx`: instância `getFirestore` local removida — usa `dbRealtime` do `firebase.js`
- `ProductPage.jsx`: cache `relatedCache` limitado a 20 entradas (`MAX_CACHE_SIZE`) — previne memory leak em sessões longas
- `api/package.json`: dependências de servidor isoladas (`firebase-admin`, `mercadopago`, `resend`, `axios`, `dotenv`)
- `package.json` raiz: dependências exclusivas do servidor removidas do bundle do frontend
- `vite.config.js`: `firebase/firestore` (completo) adicionado ao `manualChunks` do chunk firebase

### Performance e SEO
- `HeaderSearch.jsx`: query Firestore filtrada por `isActive == true` com `limit(100)` — era full scan do catálogo
- `HeaderSearch.jsx`: resultados visíveis limitados a 8 — era 50
- `HeaderSearch.jsx`: corrigido para importar de `firebase/firestore/lite` (estava usando SDK completo desnecessariamente)
- `App.jsx`: GA4 inicializado com `requestIdleCallback` — substitui `setTimeout` de 3s fixo; dados de sessão não são mais perdidos
- `scripts/generate-sitemap.cjs`: geração dinâmica do sitemap a partir dos produtos ativos do Firestore
- Sitemap integrado ao pipeline de build — gerado automaticamente antes do `vite build`
- `robots.txt`: `/sitemap.xml` agora resolve corretamente (era 404)

## [1.3.0] — 2026
### Segurança
- Middleware centralizado de autenticação Firebase (`_authMiddleware.js`)
- `userId` extraído do token no servidor em `createPayment` — impossível forjar pelo cliente
- `signUpload` protegido com Firebase ID Token — impede abuso da quota Cloudinary
- `calculateShipping` protegido com autenticação — protege token do Melhor Envio
- Rate limiting em memória para todos os endpoints da API (`_rateLimiter.js`)
- CORS wildcard removido do servidor local — paridade dev/prod com `ALLOWED_ORIGIN`
- Senha mínima de 8 caracteres com pelo menos 1 letra e 1 número (`validatePassword`)
- Barra de força de senha com feedback visual em tempo real no cadastro
- Admin verificado via JWT custom claim (`admin: true`) em vez de leitura ao Firestore — sem round-trip ao banco
- `Private.jsx` e `Login.jsx` alinhados com custom claims — imports de Firestore removidos
- Script `scripts/setAdminClaim.js` para setar claim via Firebase Admin SDK

### Correções
- `createPayment` não recebe mais `userId` do body do cliente
- `services/api.js` centraliza helper `getAuthHeader()` com ID Token em todas as chamadas
- `services/cloudinary.js` envia token de autenticação no upload assinado

## [1.2.0] — 2026
### Funcionalidades
- Sistema completo de autenticação de usuários (cadastro, login, recuperação de senha)
- Área do usuário com perfil, endereços, pedidos e segurança
- Dropdown de conta no header com iniciais do usuário
- Fluxo de checkout: carrinho → endereço → revisão → pagamento
- Cálculo de frete via Melhor Envio (PAC/SEDEX)
- Integração Mercado Pago Checkout Pro
- Webhook de confirmação de pagamento atualizando status no Firestore
- Histórico de pedidos na área do usuário
- Visualização de pedidos no dashboard admin
- Status em tempo real com onSnapshot na página de confirmação
- Badge de novos pedidos e listener em tempo real no dashboard admin
- E-mail de confirmação de pedido via Resend

### Segurança
- `Private.jsx` verifica documento `admins/{uid}` no Firestore antes de liberar acesso
- Login admin não redireciona usuários comuns para o dashboard
- Verificação HMAC de assinatura no webhook do Mercado Pago
- Preços buscados do catálogo no servidor em `createPayment`
- CSP atualizado para cobrir Firebase Auth, ViaCEP, Melhor Envio e Mercado Pago

### Correções
- Loop de redirect corrigido quando usuário comum acessa `/admin`
- Vercel Functions detectadas corretamente (`.js` + `api/package.json` commonjs)
- Body parsing manual nas Vercel Functions para produção
- CORS headers em todas as functions
- `auto_return` no Mercado Pago para redirect automático após pagamento aprovado

## [1.1.0] — 2026
### Segurança
- Headers HTTP de segurança no Vercel (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Validação de tipo e tamanho de arquivo antes do upload para Cloudinary
- Firestore Security Rules com whitelist de admin e validação de schema
- Sanitização de inputs no ProductForm antes de persistir no Firestore
- Documento `admins/{uid}` com `isAdmin` para controle de acesso granular

### Correções
- Produtos inativos filtrados na loja e em produtos relacionados
- Cache do Shop com TTL de 5 minutos substituindo cache infinito
- Fix de `q_auto` duplicado no utilitário `optimizeImage`
- URL estática no JSON-LD de produto substituindo `window.location.href`

### SEO
- JSON-LD de produto com `availability` dinâmica baseada em `isActive`
- Campo `seller` adicionado ao schema de offers

### Documentação
- `SCHEMA.md` com estrutura completa do Firestore
- `ARCHITECTURE.md` com decisões técnicas e fluxos
- `ROADMAP.md` com sprints planejadas
- `.env.example` com todas as variáveis necessárias

## [1.0.0] — Janeiro 2026
### Lançamento inicial
- Catálogo de produtos com Firestore
- Painel admin com CRUD completo
- Carrinho com persistência em localStorage e checkout via WhatsApp
- Otimização de imagens com Cloudinary
- SEO com react-helmet-async
- Deploy na Vercel