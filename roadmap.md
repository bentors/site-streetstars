# Roadmap — Street Stars

## ✅ Sprint 0 — Fundação e Hardening (Concluída)
- [x] Estrutura base: React + Vite + Tailwind + Firebase + Cloudinary
- [x] Painel admin com CRUD de produtos
- [x] Carrinho com persistência em localStorage
- [x] SEO com react-helmet-async e JSON-LD de produto
- [x] Otimização de imagens com Cloudinary (f_auto, srcSet, preload)
- [x] Headers de segurança no Vercel (CSP, X-Frame-Options, Referrer-Policy)
- [x] Validação de tipo e tamanho de arquivo no upload
- [x] Firestore Security Rules com whitelist de admin
- [x] Filtro de produtos inativos na loja
- [x] Cache com TTL no Shop
- [x] Documentação: README, SCHEMA, ARCHITECTURE, ROADMAP, .env.example

## ✅ Sprint 1 — Autenticação de Usuário (Concluída)
- [x] Página de cadastro (email, senha, nome, consentimento LGPD)
- [x] Página de login de usuário
- [x] Recuperação de senha
- [x] Área do usuário: perfil e endereços salvos
- [x] Proteção de rotas autenticadas

## ✅ Sprint 2 — Estrutura de Pedidos (Concluída)
- [x] Fluxo de checkout: carrinho → endereço → confirmação
- [x] Criação de pedido no Firestore com status pending
- [x] Histórico de pedidos na área do usuário
- [x] Visualização de pedidos no painel admin

## ✅ Sprint 3 — Integração Mercado Pago (Concluída)
- [x] Setup Vercel Functions (calculateShipping, createPayment, mpWebhook)
- [x] Firebase Admin SDK via service account
- [x] Melhor Envio API para cálculo de frete PAC/SEDEX
- [x] Mercado Pago Checkout Pro
- [x] Webhook atualizando status do pedido no Firestore
- [x] Correções de CSP para produção
- [x] Fix de detecção de Vercel Functions (.js + api/package.json)
- [x] Fix de loop de redirect admin

## ✅ Sprint 4 — Experiência Pós-compra (Concluída)
- [x] auto_return no Mercado Pago para redirect automático após pagamento
- [x] Acompanhamento de status do pedido em tempo real (onSnapshot)
- [x] E-mail de confirmação via Resend
- [x] Página de obrigado após pagamento aprovado
- [x] Notificação de novo pedido para o admin

## ✅ Sprint 5 — Security Hardening para Produção (Concluída)
- [x] Middleware centralizado de autenticação Firebase (`_authMiddleware.js`)
- [x] `signUpload` protegido: exige Firebase ID Token — impede abuso da quota Cloudinary
- [x] `createPayment` corrigido: `userId` extraído do token no servidor, nunca do body do cliente
- [x] `calculateShipping` protegido: exige autenticação para proteger token do Melhor Envio
- [x] Rate limiting em memória para todos os endpoints da API (`_rateLimiter.js`)
  - `createPayment`: 5 req/min por IP
  - `signUpload`: 10 req/min por IP
  - `calculateShipping`: 30 req/min por IP
- [x] `_server.cjs` corrigido: CORS wildcard (`*`) substituído por `ALLOWED_ORIGIN` (paridade dev/prod)
- [x] `_server.cjs`: rota `/api/signUpload` adicionada ao servidor local
- [x] `services/api.js`: helper `getAuthHeader()` centralizado; token enviado em todas as chamadas
- [x] `services/cloudinary.js`: ID Token enviado no header `Authorization` ao solicitar assinatura
- [x] `utils/validators.js`: `validatePassword()` — mínimo 8 chars, 1 letra, 1 número
- [x] `utils/validators.js`: `passwordStrength()` — retorna `'fraca' | 'média' | 'forte'`
- [x] `UserRegister.jsx`: barra de força de senha com feedback visual em tempo real
- [x] `UserRegister.jsx`: mensagens de erro de senha atualizadas

## ✅ Sprint 6 — Code Review e Production Readiness (Concluída)
- [x] CPF removido do cadastro, checkout e páginas legais — delegado ao Checkout Pro do Mercado Pago
- [x] `signUpload` corrigido: `requireAuth` substituído por `requireAdmin` — impede upload por qualquer usuário autenticado
- [x] `firestore.rules` criado no repositório com regras completas por coleção (isAdmin, isOwner, validação de schema)
- [x] `AuthLoading.jsx` extraído como componente compartilhado — elimina duplicação entre `Private.jsx` e `PrivateUser.jsx`
- [x] `firebase.js`: exporta `dbRealtime` (SDK completo) além de `db` (lite) — suporte a `onSnapshot` sem duplicar instâncias
- [x] `Dashboard.jsx`: instância `dbFull` local removida — usa `dbRealtime` centralizado
- [x] `OrderConfirmation.jsx`: instância `getFirestore` local removida — usa `dbRealtime` centralizado
- [x] `Dashboard.jsx`: imports duplicados de `auth` e `db` removidos
- [x] `ProductPage.jsx`: cache `relatedCache` limitado a 20 entradas (MAX_CACHE_SIZE) — previne memory leak
- [x] `HeaderSearch.jsx`: query Firestore filtrada por `isActive == true` com `limit(100)` — era full scan
- [x] `HeaderSearch.jsx`: resultados visíveis limitados a 8 — era 50
- [x] `HeaderSearch.jsx`: corrigido para importar de `firebase/firestore/lite` (estava usando SDK completo)
- [x] `App.jsx`: GA4 inicializado com `requestIdleCallback` — era `setTimeout` de 3s fixo
- [x] `api/package.json`: dependências de servidor isoladas (`firebase-admin`, `mercadopago`, `resend`, `axios`, `dotenv`)
- [x] `package.json` raiz: dependências exclusivas do servidor removidas do bundle do frontend
- [x] `vite.config.js`: `firebase/firestore` (completo) adicionado ao `manualChunks` do chunk firebase
- [x] `scripts/generate-sitemap.cjs`: geração dinâmica do sitemap a partir dos produtos ativos do Firestore
- [x] `sitemap.xml` gerado automaticamente a cada build com produtos + rotas estáticas
- [x] `robots.txt`: `/sitemap.xml` agora resolve corretamente (era 404)
- [x] Rate limiter migrado de memória para Upstash Redis (`@upstash/ratelimit` + `@upstash/redis`)
  - Estado persiste entre instâncias serverless — rate limit garantido em produção
  - Algoritmo `slidingWindow` — elimina brecha de boundary entre janelas fixas
  - Fallback gracioso: loga erro mas não derruba o endpoint se Redis estiver indisponível
- [x] `calculateShipping`, `createPayment`, `signUpload`: `await` adicionado na chamada do rate limiter

## 🔭 Backlog Futuro

### Segurança
- [ ] Verificação de e-mail obrigatória antes do primeiro checkout (`sendEmailVerification`)
- [ ] Logs de auditoria para ações admin (criação/edição/exclusão de produtos)
- [ ] Política de renovação de tokens de API de terceiros (MP, Melhor Envio, Cloudinary)

### Performance e Escalabilidade
- [ ] TanStack Query / SWR para cache de requisições Firestore
- [ ] Paginação com cursor no Dashboard admin e na loja (`startAfter` + `limit`)
- [ ] `loading="lazy"` e `fetchpriority="high"` padronizados em todas as imagens de produto
- [ ] Migração para Next.js (quando SEO orgânico de produto virar prioridade crítica)

### Produto
- [ ] Upload assinado no Cloudinary com `folder` e `tags` por produto
- [ ] Gestão de estoque por variante (tamanho + cor)
- [ ] Cupons de desconto
- [ ] Avaliações de produto