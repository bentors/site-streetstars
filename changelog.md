# Changelog — Street Stars

## [1.1.0] — 2026
### Segurança
- Headers HTTP de segurança no Vercel (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Validação de tipo e tamanho de arquivo antes do upload para Cloudinary
- Firestore Security Rules com whitelist de admin e validação de schema
- Sanitização de inputs no ProductForm antes de persistir no Firestore
- Documento admins/{uid} com isAdmin para controle de acesso granular

### Correções
- Produtos inativos agora são filtrados na loja e em produtos relacionados
- Cache do Shop com TTL de 5 minutos substituindo cache infinito
- Fix de q_auto duplicado no utilitário optimizeImage
- URL estática no JSON-LD de produto substituindo window.location.href

### SEO
- JSON-LD de produto com availability dinâmica baseada em isActive
- Campo seller adicionado ao schema de offers

### Documentação
- SCHEMA.md com estrutura completa do Firestore
- ARCHITECTURE.md com decisões técnicas e fluxos
- ROADMAP.md com sprints planejadas
- .env.example com todas as variáveis necessárias

## [1.0.0] — Janeiro 2026
### Lançamento inicial
- Catálogo de produtos com Firestore
- Painel admin com CRUD completo
- Carrinho com persistência em localStorage e checkout via WhatsApp
- Otimização de imagens com Cloudinary
- SEO com react-helmet-async
- Deploy na Vercel

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

### Segurança
- Private.jsx agora verifica papel admin no Firestore antes de liberar acesso
- Login admin não redireciona usuários comuns para o dashboard
- CSP atualizado para cobrir Firebase Auth, ViaCEP, Melhor Envio e Mercado Pago

### Correções
- Loop de redirect corrigido quando usuário comum acessa /admin
- Vercel Functions detectadas corretamente (.js + api/package.json commonjs)
- Body parsing manual nas Vercel Functions para produção
- CORS headers em todas as functions