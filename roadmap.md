# Roadmap — Street Stars

## ✅ Sprint 0 — Fundação e Hardening (Concluído)
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

## 🔄 Sprint 1 — Autenticação de Usuário (Concluído)
- [x] Página de cadastro (email, senha, nome, CPF, consentimento LGPD)
- [x] Página de login de usuário
- [x] Recuperação de senha
- [x] Área do usuário: perfil e endereços salvos
- [x] Proteção de rotas autenticadas

## ⏳ Sprint 2 — Estrutura de Pedidos (Concluído)
- [x] Fluxo de checkout: carrinho → endereço → confirmação
- [x] Criação de pedido no Firestore com status pending
- [x] Histórico de pedidos na área do usuário
- [x] Visualização de pedidos no painel admin

## ⏳ Sprint 3 — Integração Mercado Pago
- [ ] Setup Firebase Cloud Functions
- [ ] Function createPayment: cria preferência no Mercado Pago
- [ ] Function mpWebhook: recebe confirmação e atualiza status
- [ ] Checkout Pro (página hosted do Mercado Pago)
- [ ] Upload assinado Cloudinary via Cloud Function

## ⏳ Sprint 4 — Experiência Pós-compra
- [ ] Acompanhamento de status do pedido em tempo real (onSnapshot)
- [ ] E-mail de confirmação via Firebase Extensions
- [ ] Página de obrigado após pagamento aprovado
- [ ] Notificação de status para o admin

## 🔭 Backlog Futuro
- [ ] TanStack Query para cache de requisições
- [ ] Paginação no Dashboard admin
- [ ] Migração para Next.js (quando SEO virar prioridade)
- [ ] Upload assinado no Cloudinary