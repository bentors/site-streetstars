# Street Stars

E-commerce de streetwear da Street Stars, em Next.js 16 + Firebase.
Arquitetura e decisões: [`docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`](docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md).

> O app antigo (Vite) está em `legacy/` apenas como referência e será removido ao fim da Fase 2.

## Requisitos

- Node 24
- Java 21 (emulador do Firestore)

## Primeiros passos

```bash
npm install
cp .env.example .env.local   # preencha com o projeto Firebase de desenvolvimento
npm run dev
```

## Comandos

| Comando                                                 | O que faz                                             |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                                           | Servidor de desenvolvimento                           |
| `npm run build`                                         | Build de produção                                     |
| `npm run lint` · `npm run typecheck` · `npm run format` | Qualidade de código                                   |
| `npm test`                                              | Testes unitários e de componentes                     |
| `npm run test:emulator`                                 | Testes de regras e integração no emulador do Firebase |
| `npm run grant-admin -- <email>`                        | Torna um usuário admin (ele precisa entrar de novo)   |

## Regras do projeto

- Só o servidor acessa o Firestore (Admin SDK); as regras negam todo acesso de cliente.
- Dinheiro sempre em centavos inteiros.
- Código de servidor fica em `src/server` e importa `server-only`.
