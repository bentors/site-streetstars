# Street Stars

E-commerce de streetwear da Street Stars, em Next.js 16 + Firebase.
Arquitetura e decisões: [`docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`](docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md).

> O app antigo (Vite) está em `legacy/` apenas como referência e será removido ao fim da Fase 2.

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

| Comando                                     | O que faz                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `make dev`                                  | Servidor de desenvolvimento                                             |
| `make check`                                | Tudo o que o CI roda: lint, formatação, tipos, testes, emulador e build |
| `make test`                                 | Testes unitários e de componentes                                       |
| `make test-emulator`                        | Testes de regras e integração (Java local ou container descartável)     |
| `make emulators-up` · `make emulators-down` | Emuladores em Docker, com UI em http://localhost:4000                   |
| `make lint-sh`                              | Valida os scripts `.sh` com shellcheck                                  |
| `make grant-admin EMAIL=...`                | Torna um usuário admin (ele precisa entrar de novo)                     |

## Regras do projeto

- Só o servidor acessa o Firestore (Admin SDK); as regras negam todo acesso de cliente.
- Dinheiro sempre em centavos inteiros.
- Código de servidor fica em `src/server` e importa `server-only`.
