# Street Stars

E-commerce de streetwear da Street Stars, em Next.js 16 + Firebase.
Arquitetura e decisões: [`docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`](docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md).

## Requisitos

- Node 24
- Git Bash (no Windows) e `make` (`winget install ezwinports.make`)
- Docker Desktop **ou** Java 21, para os emuladores do Firebase

## Primeiros passos

```bash
make setup    # confere ferramentas, cria .env.local e instala dependências
make doctor   # diagnóstico do ambiente
make dev
```

Preencha o `.env.local` com o projeto Firebase de desenvolvimento antes de rodar o app.

## Comandos

Rode `make` para ver todos. Os principais:

| Comando                                     | O que faz                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `make dev`                                  | Servidor de desenvolvimento                                                         |
| `make check`                                | Lint, formatação, tipos, testes, emulador e build (o CI roda também `make lint-sh`) |
| `make test`                                 | Testes unitários e de componentes                                                   |
| `make test-emulator`                        | Testes de regras e integração (Java local ou container descartável)                 |
| `make emulators-up` · `make emulators-down` | Emuladores em Docker, com UI em http://localhost:4000                               |
| `make lint-sh`                              | Valida os scripts `.sh` com shellcheck                                              |
| `make grant-admin EMAIL=...`                | Torna um usuário admin (e-mail confirmado; ele precisa entrar de novo)              |
| `make catalog-export FILE=...`              | Exporta o catálogo do projeto do `.env.local`                                       |
| `make catalog-import FILE=... ENV=...`      | Importa o catálogo em outro projeto, sem sobrescrever                               |

## Lançamento (checklist)

1. Criar o projeto Firebase de produção e ativar Authentication (e-mail/senha e Google) com a política de senha: mínimo 8, máximo 128, exigir número, modo "exigir", sem forçar upgrade.
2. `npx firebase deploy --only firestore:rules,firestore:indexes --project <prod>`. Sem os índices, o cron de expiração, `/conta` e o filtro do admin quebram.
3. Variáveis na Vercel (produção): todas do `.env.example`, incluindo `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` e `CRON_SECRET`; credenciais reais do Mercado Pago e do Melhor Envio (token só com `shipping-calculate`).
4. Catálogo: `make catalog-export FILE=.backups/catalogo.json` (dev) e `make catalog-import FILE=.backups/catalogo.json ENV=.env.production.local`. As fotos apontam para o Cloudinary de teste: reenvie pelo admin na conta de produção antes de desativar a de teste.
5. Admin: entrar com o e-mail da loja (confirmado) e rodar o grant-admin com o `.env` de produção.
6. Webhook do Mercado Pago apontando para `https://<domínio>/api/webhooks/mercadopago`, com o segredo em `MERCADOPAGO_WEBHOOK_SECRET`.
7. Resend com o domínio próprio verificado e `EMAIL_FROM` desse domínio.

## Regras do projeto

- Só o servidor acessa o Firestore (Admin SDK); as regras negam todo acesso de cliente.
- Dinheiro sempre em centavos inteiros.
- Código de servidor fica em `src/server` e importa `server-only`.
