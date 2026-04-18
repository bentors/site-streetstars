<div align="center">
  <img src="https://res.cloudinary.com/dmsvju9ca/image/upload/v1769730868/logo_fundopreto_y87j0h.png" alt="Street Stars Logo" width="200">

  # Street Stars — E-commerce

  ### Streetwear autêntico nascido em São Paulo.

  [Site ao Vivo](https://streetstars.vercel.app/) • [Reportar Bug](https://github.com/bentors/site-streetstars/issues)

</div>

---

## Sobre o Projeto

O **Street Stars** é um e-commerce de streetwear desenvolvido com foco em performance, fluidez e experiência mobile-first. Como cofundador e desenvolvedor principal, o desafio foi criar uma plataforma que respira a cultura urbana sem abrir mão de velocidade e qualidade técnica.

---

## Stack

| Ferramenta | Uso |
| :--- | :--- |
| React + Vite | SPA com lazy loading e code splitting |
| Tailwind CSS | Estilização utilitária e responsiva |
| Framer Motion | Animações e micro-interações |
| Firebase Auth | Autenticação de usuários e admin |
| Firestore | Banco de dados de produtos, usuários e pedidos |
| Cloudinary | Gerenciamento e entrega otimizada de imagens |
| Vercel | Deploy e CDN |
| Google Analytics 4 | Análise de tráfego |

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── admin/        # Formulários do painel admin
│   ├── home/         # Seções da home
│   ├── layout/       # Header, Footer, CartDrawer
│   ├── shop/         # Listagem de produtos
│   └── ui/           # Componentes reutilizáveis (Logo, SEO...)
├── context/          # CartContext
├── data/             # Dados estáticos (categorias, coleções)
├── pages/
│   ├── admin/        # Dashboard, Login, NewProduct, EditProduct
│   └── ...           # ProductPage, CollectionPage, LegalInfo
├── routes/           # Private route guard
├── services/         # Firebase, Cloudinary
├── utils/            # Analytics, formatters, image optimizer
└── styles/           # Animações globais
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

```bash
cp .env.example .env
```

---

## Rodando Localmente

```bash
npm install
npm run dev
```

---

## Deploy

O projeto faz deploy automático na Vercel a cada push na branch `main`.

---

## Fundadores

- **Bento Rangel** — Software Developer & Co-founder
- **Felipe dos Santos** — Designer & Co-founder

---

<div align="center">
  <p>Desenvolvido com ⚡ por Bento Rangel</p>
</div>