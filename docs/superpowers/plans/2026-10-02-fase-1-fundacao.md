# Fase 1 — Fundação: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o SPA Vite por um projeto Next.js 16 vazio, mas completo na fundação: TypeScript strict, Tailwind v4, design system, validação de ambiente, Firebase Admin com regras "nega tudo", sessão por cookie (e-mail + Google), proxy de rotas protegidas, rate limit, headers de segurança e CI.

**Architecture:** Só o servidor acessa o Firestore (Admin SDK). No navegador, o Firebase é usado apenas para autenticar; o ID token vira um session cookie httpOnly criado numa Server Action. Lógica pura fica em `src/lib` e `src/server/domain`; código de servidor importa `server-only`.

**Tech Stack:** Next.js 16.3, React 19, TypeScript 5.9, Tailwind CSS 4.3, zod 4, firebase 12 (auth), firebase-admin 14, @upstash/ratelimit 2, Vitest 5 + Testing Library, firebase-tools (emuladores), ESLint 9 + eslint-config-next 16, Prettier 3.

**Spec:** `docs/superpowers/specs/2026-10-02-redesign-nextjs-design.md`

## Global Constraints

- Node 24 local e no CI; `engines.node` = `>=20.9.0` (mínimo do Next 16).
- TypeScript **5.9** (não usar 7.x). ESLint **9** (não usar 10.x).
- `tsconfig`: `strict: true`, `noUncheckedIndexedAccess: true`, alias `@/*` → `src/*`.
- Dinheiro sempre em centavos inteiros (`Cents`).
- Erros esperados de Server Actions retornam `Result<T>`; nunca lançar erro para o usuário com detalhes internos.
- Mensagens ao usuário em português.
- Todo arquivo em `src/server/**` começa com `import 'server-only'`.
- Variáveis `NEXT_PUBLIC_*` são lidas por referência literal (`process.env.NEXT_PUBLIC_X`), nunca por chave dinâmica.
- O código antigo vive em `legacy/` até o fim da Fase 2 e é ignorado por TypeScript, ESLint, Prettier, Vitest e Tailwind.
- Commits: Conventional Commits em inglês, como o histórico do repo; sem trailers ou menções a IA; nunca `git push`.
- Projeto de emulador: `demo-streetstars`.

## Review Focus

1. **Open redirect pelo `?next=`** (`//evil.com`, `/\evil.com`, `https://evil.com`): o login deve sempre cair numa rota interna. Testado em `safeNextPath` (Task 10).
2. **Sessão de usuário desativado ou com tokens revogados:** o cookie ainda existe, mas `getSessionUser()` deve devolver `null`. Testado na Task 10.
3. **ID token antigo (login há mais de 5 minutos) usado para criar sessão:** deve ser recusado com `recent_login_required`, sem gravar cookie. Testado na Task 10.
4. **Variável de ambiente faltando em produção:** a aplicação deve falhar na subida citando o nome da variável, não com erro genérico depois. Testado na Task 4.
5. **`FIREBASE_PRIVATE_KEY` colada na Vercel com `\n` literais:** deve virar quebra de linha real. Testado na Task 4.

## Pré-requisitos (ações do usuário, antes da Task 7)

1. Instalar o JDK (emulador do Firestore):
   `! winget install --id Microsoft.OpenJDK.21 -e --source winget --accept-source-agreements --accept-package-agreements`
   Fechar e reabrir o terminal; conferir com `java -version`.
2. Criar o projeto Firebase **dev** (ex.: `street-stars-dev`) no console:
   - Authentication → provedores **E-mail/senha** e **Google** ativados.
   - Firestore → criar banco em modo nativo (região `southamerica-east1`).
   - Configurações do projeto → registrar um app Web (copiar `apiKey`, `authDomain`, `projectId`, `appId`).
   - Contas de serviço → gerar chave privada (JSON) para o Admin SDK.
3. Criar `.env.local` (a partir do `.env.example` da Task 4) com os valores do projeto dev. Upstash é opcional em desenvolvimento.

## Estrutura de arquivos ao fim da fase

```
legacy/                         app Vite antigo (somente referência)
.github/workflows/ci.yml        lint, typecheck, testes, emulador, build
firebase.json                   emuladores firestore + auth
firestore.rules                 nega tudo
firestore.indexes.json          vazio por enquanto
next.config.ts                  imagens + headers de segurança
eslint.config.mjs · .prettierrc.json · .prettierignore
postcss.config.mjs · tsconfig.json · vitest.config.mts
.env.example · README.md
scripts/grant-admin.ts
tests/
  stubs/server-only.ts          stub para o Vitest
  setup-dom.ts                  jest-dom + polyfill de <dialog>
  setup-integration.ts          env do emulador
  integration/helpers.ts        clearFirestore()
  integration/users.test.ts
  rules/firestore.rules.test.ts
src/
  proxy.ts                      redireciona /conta e /admin sem cookie
  instrumentation.ts            valida env na subida
  app/
    layout.tsx · globals.css · page.tsx · error.tsx · not-found.tsx
    (auth)/layout.tsx · (auth)/entrar/page.tsx
    conta/page.tsx · admin/page.tsx
  components/
    brand/logo.tsx
    ui/ button, spinner, field, input, select, checkbox, badge,
        container, dialog (Modal + Drawer), toast, index
  features/auth/
    actions.ts · error-messages.ts · sign-in-form.tsx · sign-out-button.tsx
  lib/
    cn.ts · result.ts · money.ts · cpf.ts · cep.ts · phone.ts
    env.ts · safe-next-path.ts · session-cookie.ts
    security-headers.ts · firebase-client.ts
  server/
    env.ts · ratelimit.ts
    db/ firebase-admin.ts · convert.ts · users.ts
    auth/ session.ts
```

---

### Task 1: Mover o app antigo e criar o projeto Next.js 16

**Files:**
- Move: tudo do app Vite → `legacy/`
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`, `public/favicon.ico`
- Modify: `.gitignore`

**Interfaces:**
- Produces: tokens de tema Tailwind (`ink`, `paper`, `surface`, `surface-2`, `line`, `muted`, `danger`, `success`, `warning`, `info`; fontes `font-sans`, `font-display`), usados por todos os componentes.

- [ ] **Step 1: Mover o app antigo para `legacy/`**

```bash
cd /c/dev/streetstars/street-stars-site
mkdir legacy
git mv src api public scripts index.html vite.config.js eslint.config.js \
  postcss.config.js tailwind.config.js package.json package-lock.json \
  firestore.rules vercel.json README.md architecture.md changelog.md \
  roadmap.md schema.md legacy/
rm -rf node_modules dist
mkdir -p public && git mv legacy/public/favicon.ico public/favicon.ico
git status --short | head -50
```

Expected: só renomeações (`R`) para `legacy/` e o favicon voltando para `public/`.

- [ ] **Step 2: Atualizar o `.gitignore`**

Acrescentar ao final de `.gitignore`:

```gitignore

# Next.js
.next/
out/
next-env.d.ts
*.tsbuildinfo

# Testes
coverage/

# Firebase emuladores
firebase-debug.log
firestore-debug.log
ui-debug.log
```

- [ ] **Step 3: Criar o `package.json`**

```json
{
  "name": "streetstars",
  "private": true,
  "version": "0.1.0",
  "engines": {
    "node": ">=20.9.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

- [ ] **Step 4: Instalar dependências**

```bash
npm install next@16.3 react@19 react-dom@19 clsx@2
npm install -D typescript@5.9 @types/node@24 @types/react@19 @types/react-dom@19 \
  tailwindcss@4 @tailwindcss/postcss@4
```

Expected: instala sem erro de peer dependency.

- [ ] **Step 5: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "tests/**/*.ts",
    "tests/**/*.tsx",
    "scripts/**/*.ts",
    "*.ts",
    "*.mts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "legacy"]
}
```

- [ ] **Step 6: Criar `next.config.ts` e `postcss.config.mjs`**

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
}

export default nextConfig
```

`postcss.config.mjs`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 7: Criar `src/app/globals.css` com os tokens**

```css
@import 'tailwindcss';

@source not "../../legacy";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;

  --color-ink: #000000;
  --color-paper: #ffffff;
  --color-surface: #0a0a0a;
  --color-surface-2: #18181b;
  --color-line: rgb(255 255 255 / 0.1);
  --color-muted: rgb(255 255 255 / 0.5);
  --color-danger: #f87171;
  --color-success: #4ade80;
  --color-warning: #facc15;
  --color-info: #60a5fa;
}

html {
  color-scheme: dark;
  scrollbar-width: thin;
  scrollbar-color: #333 #000;
}

::selection {
  background: var(--color-paper);
  color: var(--color-ink);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 8: Criar layout, home provisória, erro e 404**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Street Stars | Estrelas nascem nas ruas', template: '%s | Street Stars' },
  description: 'Streetwear autêntico nascido em São Paulo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh bg-ink font-sans text-paper antialiased">{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <p className="text-xs uppercase tracking-[0.4em] text-muted">Street Stars — em construção</p>
    </main>
  )
}
```

`src/app/error.tsx`:

```tsx
'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-black uppercase italic tracking-tighter">Algo deu errado</h1>
      <p className="text-sm text-muted">Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="bg-paper px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-ink"
      >
        Tentar de novo
      </button>
    </main>
  )
}
```

`src/app/not-found.tsx`:

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-widest">Essa estrela se perdeu no caminho</h1>
      <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-paper">
        Voltar para a home
      </Link>
    </main>
  )
}
```

- [ ] **Step 9: Verificar o build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` e as rotas `/` e `/_not-found` listadas. Depois `npm run dev`, abrir `http://localhost:3000` e ver o texto "Street Stars — em construção" na fonte Inter.

- [ ] **Step 10: Commit**

```bash
git add -A legacy public .gitignore package.json package-lock.json tsconfig.json \
  next.config.ts postcss.config.mjs src
git status --short
git commit -m "build: scaffold next.js 16 app and move vite app to legacy"
```

---

### Task 2: Ferramentas — ESLint, Prettier, typecheck e Vitest

**Files:**
- Create: `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `tests/stubs/server-only.ts`, `tests/setup-dom.ts`, `src/lib/cn.ts`, `src/lib/cn.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `cn(...inputs): string` em `@/lib/cn`; projetos Vitest `unit` (`src/**/*.test.ts`, node), `dom` (`src/**/*.test.tsx`, jsdom), `rules` (`tests/rules/**`), `integration` (`tests/integration/**`).

- [ ] **Step 1: Instalar ferramentas**

```bash
npm install server-only zod@4
npm install -D eslint@9 eslint-config-next@16.3 prettier@3 prettier-plugin-tailwindcss \
  vitest@5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom
```

- [ ] **Step 2: Configurar ESLint e Prettier**

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'coverage/**', 'legacy/**', 'next-env.d.ts']),
])
```

`.prettierrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:

```
legacy
.next
coverage
package-lock.json
docs
```

- [ ] **Step 3: Configurar o Vitest**

`tests/stubs/server-only.ts`:

```ts
// O pacote 'server-only' lança erro fora do ambiente react-server do Next.
// Nos testes, o próprio Vitest roda no servidor, então o stub é vazio.
export {}
```

`tests/setup-dom.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom não implementa showModal/close de <dialog>.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
```

`vitest.config.mts`:

```ts
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fromRoot('./src'),
      'server-only': fromRoot('./tests/stubs/server-only.ts'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./tests/setup-dom.ts'],
        },
      },
      {
        extends: true,
        test: { name: 'rules', environment: 'node', include: ['tests/rules/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['./tests/setup-integration.ts'],
          fileParallelism: false,
        },
      },
    ],
  },
})
```

- [ ] **Step 4: Escrever o teste do `cn` (falha primeiro)**

`src/lib/cn.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('junta classes e ignora valores falsos', () => {
    expect(cn('a', false, null, undefined, 'b', { c: true, d: false })).toBe('a b c')
  })
})
```

- [ ] **Step 5: Adicionar scripts e rodar o teste**

Em `package.json`, substituir `"scripts"` por:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "next typegen && tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest run --project unit --project dom --passWithNoTests",
  "test:watch": "vitest --project unit --project dom"
}
```

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./cn"`.

- [ ] **Step 6: Implementar `cn`**

`src/lib/cn.ts`:

```ts
export { clsx as cn } from 'clsx'
```

- [ ] **Step 7: Verificar tudo**

```bash
npm test && npm run lint && npm run typecheck && npm run format:check
```

Expected: 1 teste passando; lint, typecheck e Prettier sem erros. Se o Prettier apontar arquivos da Task 1, rodar `npm run format` e conferir o diff.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json eslint.config.mjs .prettierrc.json .prettierignore \
  vitest.config.mts tests src
git commit -m "build: add eslint, prettier, typecheck and vitest setup"
```

---

### Task 3: Utilitários de domínio — `Result`, dinheiro, CPF, CEP e telefone

**Files:**
- Create: `src/lib/result.ts`, `src/lib/money.ts`, `src/lib/cpf.ts`, `src/lib/cep.ts`, `src/lib/phone.ts` e um `*.test.ts` para cada

**Interfaces:**
- Produces:
  - `type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string }`, `ok<T>(data: T): Result<T>`, `fail(code: string, message: string): { ok: false; code: string; message: string }`
  - `type Cents = number`, `isCents(v: unknown): v is Cents`, `toCents(reais: number): Cents`, `parseReaisToCents(input: string): Cents | null`, `formatBRL(cents: Cents): string`
  - `normalizeCpf(s): string`, `isValidCpf(s): boolean`, `formatCpf(s): string`
  - `normalizeCep(s): string`, `isValidCep(s): boolean`, `formatCep(s): string`
  - `normalizePhone(s): string`, `isValidPhone(s): boolean`, `formatPhone(s): string`

- [ ] **Step 1: Escrever os testes (falham primeiro)**

`src/lib/result.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { fail, ok } from './result'

describe('Result', () => {
  it('ok carrega os dados', () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } })
  })
  it('fail carrega código e mensagem', () => {
    expect(fail('not_found', 'Não encontrado.')).toEqual({
      ok: false,
      code: 'not_found',
      message: 'Não encontrado.',
    })
  })
})
```

`src/lib/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatBRL, isCents, parseReaisToCents, toCents } from './money'

describe('formatBRL', () => {
  it('formata centavos em reais', () => {
    expect(formatBRL(12990)).toBe('R$ 129,90')
    expect(formatBRL(0)).toBe('R$ 0,00')
    expect(formatBRL(123456789)).toBe('R$ 1.234.567,89')
  })
})

describe('toCents', () => {
  it('converte reais em centavos inteiros', () => {
    expect(toCents(129.9)).toBe(12990)
    expect(toCents(0.1 + 0.2)).toBe(30)
  })
  it('recusa valores negativos ou não finitos', () => {
    expect(() => toCents(-1)).toThrow(RangeError)
    expect(() => toCents(Number.NaN)).toThrow(RangeError)
  })
})

describe('parseReaisToCents', () => {
  it.each([
    ['129,90', 12990],
    ['129.9', 12990],
    ['129', 12900],
    [' 5,5 ', 550],
    ['0,01', 1],
  ])('%s → %i', (input, expected) => {
    expect(parseReaisToCents(input)).toBe(expected)
  })
  it.each(['', 'abc', '1.299,90', '10,999', '-5', '12,'])('recusa %s', (input) => {
    expect(parseReaisToCents(input)).toBeNull()
  })
})

describe('isCents', () => {
  it('aceita só inteiros não negativos', () => {
    expect(isCents(100)).toBe(true)
    expect(isCents(0)).toBe(true)
    expect(isCents(1.5)).toBe(false)
    expect(isCents(-1)).toBe(false)
    expect(isCents('100')).toBe(false)
  })
})
```

`src/lib/cpf.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatCpf, isValidCpf, normalizeCpf } from './cpf'

describe('cpf', () => {
  it('normaliza removendo tudo que não é dígito', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725')
  })
  it('valida dígitos verificadores', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
    expect(isValidCpf('529.982.247-24')).toBe(false)
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('123')).toBe(false)
  })
  it('formata de forma progressiva para inputs', () => {
    expect(formatCpf('5299')).toBe('529.9')
    expect(formatCpf('5299822')).toBe('529.982.2')
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCpf('529982247259999')).toBe('529.982.247-25')
  })
})
```

`src/lib/cep.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatCep, isValidCep, normalizeCep } from './cep'

describe('cep', () => {
  it('normaliza', () => {
    expect(normalizeCep('01310-100')).toBe('01310100')
  })
  it('valida 8 dígitos e recusa zeros', () => {
    expect(isValidCep('01310-100')).toBe(true)
    expect(isValidCep('0131010')).toBe(false)
    expect(isValidCep('00000-000')).toBe(false)
  })
  it('formata de forma progressiva', () => {
    expect(formatCep('01310')).toBe('01310')
    expect(formatCep('013101')).toBe('01310-1')
    expect(formatCep('013101009999')).toBe('01310-100')
  })
})
```

`src/lib/phone.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone } from './phone'

describe('phone', () => {
  it('normaliza', () => {
    expect(normalizePhone('(11) 99999-8888')).toBe('11999998888')
  })
  it('valida celular e fixo com DDD', () => {
    expect(isValidPhone('(11) 99999-8888')).toBe(true)
    expect(isValidPhone('(11) 3333-4444')).toBe(true)
    expect(isValidPhone('(11) 89999-8888')).toBe(false)
    expect(isValidPhone('(01) 3333-4444')).toBe(false)
    expect(isValidPhone('123')).toBe(false)
  })
  it('formata de forma progressiva', () => {
    expect(formatPhone('1')).toBe('(1')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — imports `./result`, `./money`, `./cpf`, `./cep`, `./phone` não resolvem.

- [ ] **Step 3: Implementar**

`src/lib/result.ts`:

```ts
export type Failure = { ok: false; code: string; message: string }
export type Result<T> = { ok: true; data: T } | Failure

export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function fail(code: string, message: string): Failure {
  return { ok: false, code, message }
}
```

`src/lib/money.ts`:

```ts
/** Valor monetário em centavos inteiros. Nunca use reais em float para cálculos. */
export type Cents = number

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function isCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function toCents(reais: number): Cents {
  if (!Number.isFinite(reais) || reais < 0) throw new RangeError(`Valor inválido: ${reais}`)
  return Math.round(reais * 100)
}

/** Converte texto digitado ("129,90", "129.9", "129") em centavos, sem passar por float. */
export function parseReaisToCents(input: string): Cents | null {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(input.trim())
  if (!match) return null
  const [, whole = '', fraction = ''] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

export function formatBRL(cents: Cents): string {
  return brl.format(cents / 100)
}
```

`src/lib/cpf.ts`:

```ts
export function normalizeCpf(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digits = cpf.split('').map(Number)
  const checkDigit = (length: number) => {
    const sum = digits.slice(0, length).reduce((acc, d, i) => acc + d * (length + 1 - i), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10]
}

export function formatCpf(input: string): string {
  return normalizeCpf(input)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}
```

`src/lib/cep.ts`:

```ts
export function normalizeCep(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidCep(input: string): boolean {
  const cep = normalizeCep(input)
  return /^\d{8}$/.test(cep) && cep !== '00000000'
}

export function formatCep(input: string): string {
  return normalizeCep(input)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}
```

`src/lib/phone.ts`:

```ts
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidPhone(input: string): boolean {
  const phone = normalizePhone(input)
  if (!/^[1-9]\d\d{8,9}$/.test(phone)) return false
  return phone.length === 10 || phone[2] === '9'
}

export function formatPhone(input: string): string {
  const d = normalizePhone(input).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS em todos os arquivos.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat(lib): add result, money, cpf, cep and phone helpers"
```

---

### Task 4: Validação das variáveis de ambiente

**Files:**
- Create: `src/lib/env.ts`, `src/lib/env.test.ts`, `src/server/env.ts`, `src/server/env.test.ts`, `src/instrumentation.ts`, `.env.example`
- Modify: `src/app/layout.tsx` (usar `publicEnv()`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `parseEnv<T extends z.ZodType>(schema: T, source: Record<string, string | undefined>): z.infer<T>` (lança `Error('Variáveis de ambiente inválidas ou ausentes: A, B')`)
  - `publicEnvSchema`, `type PublicEnv`, `publicEnv(): PublicEnv` em `@/lib/env`
  - `serverEnvSchema`, `type ServerEnv`, `parseServerEnv(source): ServerEnv`, `serverEnv(): ServerEnv` em `@/server/env`
  - Campos de `ServerEnv`: `NODE_ENV`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL?`, `FIREBASE_PRIVATE_KEY?` (com `\n` reais), `FIRESTORE_EMULATOR_HOST?`, `UPSTASH_REDIS_REST_URL?`, `UPSTASH_REDIS_REST_TOKEN?`

- [ ] **Step 1: Escrever os testes**

`src/lib/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseEnv, publicEnvSchema } from './env'

const valid = {
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'dev.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'street-stars-dev',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
}

describe('publicEnv', () => {
  it('aceita configuração completa', () => {
    expect(parseEnv(publicEnvSchema, valid)).toEqual(valid)
  })
  it('lista as variáveis ausentes no erro', () => {
    const { NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_FIREBASE_APP_ID, ...rest } = valid
    void NEXT_PUBLIC_SITE_URL
    void NEXT_PUBLIC_FIREBASE_APP_ID
    expect(() => parseEnv(publicEnvSchema, rest)).toThrow(
      'Variáveis de ambiente inválidas ou ausentes: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_FIREBASE_APP_ID',
    )
  })
})
```

`src/server/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseServerEnv } from './env'

describe('parseServerEnv', () => {
  it('aceita emulador sem credenciais', () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      FIREBASE_PROJECT_ID: 'demo-streetstars',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    })
    expect(env.FIREBASE_PROJECT_ID).toBe('demo-streetstars')
  })

  it('exige credenciais quando não há emulador', () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: 'development', FIREBASE_PROJECT_ID: 'street-stars-dev' }),
    ).toThrow(/FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY/)
  })

  it('converte \\n literais da chave privada em quebras de linha', () => {
    const env = parseServerEnv({
      NODE_ENV: 'development',
      FIREBASE_PROJECT_ID: 'street-stars-dev',
      FIREBASE_CLIENT_EMAIL: 'sa@dev.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n',
    })
    expect(env.FIREBASE_PRIVATE_KEY).toBe(
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
    )
  })

  it('exige Upstash em produção', () => {
    expect(() =>
      parseServerEnv({
        NODE_ENV: 'production',
        FIREBASE_PROJECT_ID: 'street-stars-system',
        FIREBASE_CLIENT_EMAIL: 'sa@prod.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'key',
      }),
    ).toThrow(/UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `./env` não existe.

- [ ] **Step 3: Implementar**

`src/lib/env.ts`:

```ts
import { z } from 'zod'

export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${names.join(', ')}`)
  }
  return result.data
}

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

let cached: PublicEnv | undefined

export function publicEnv(): PublicEnv {
  // Referências literais: o Next só embute NEXT_PUBLIC_* lidas assim no bundle do cliente.
  cached ??= parseEnv(publicEnvSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
  return cached
}
```

`src/server/env.ts`:

```ts
import 'server-only'
import { z } from 'zod'
import { parseEnv } from '@/lib/env'

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().min(1).optional(),
    FIREBASE_PRIVATE_KEY: z
      .string()
      .min(1)
      .optional()
      .transform((key) => key?.replace(/\\n/g, '\n')),
    FIRESTORE_EMULATOR_HOST: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    const required = (key: keyof typeof env, reason: string) => {
      if (!env[key]) ctx.addIssue({ code: 'custom', path: [key], message: reason })
    }
    if (!env.FIRESTORE_EMULATOR_HOST) {
      required('FIREBASE_CLIENT_EMAIL', 'obrigatória fora do emulador')
      required('FIREBASE_PRIVATE_KEY', 'obrigatória fora do emulador')
    }
    if (env.NODE_ENV === 'production') {
      required('UPSTASH_REDIS_REST_URL', 'obrigatória em produção')
      required('UPSTASH_REDIS_REST_TOKEN', 'obrigatória em produção')
    }
  })

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return parseEnv(serverEnvSchema, source)
}

let cached: ServerEnv | undefined

export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env)
  return cached
}
```

`src/instrumentation.ts`:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  // Falha na subida se faltar alguma variável, em vez de quebrar numa requisição.
  const { serverEnv } = await import('./server/env')
  const { publicEnv } = await import('./lib/env')
  serverEnv()
  publicEnv()
}
```

`.env.example`:

```bash
# ── Público (vai para o navegador) ─────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=street-stars-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=street-stars-dev
NEXT_PUBLIC_FIREBASE_APP_ID=

# ── Servidor ──────────────────────────────────────────────────
FIREBASE_PROJECT_ID=street-stars-dev
FIREBASE_CLIENT_EMAIL=
# Cole a chave em uma linha, com \n literais.
FIREBASE_PRIVATE_KEY=

# Rate limit (opcional em desenvolvimento, obrigatório em produção)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Em `src/app/layout.tsx`, adicionar `import { publicEnv } from '@/lib/env'` e trocar a linha do `metadataBase` por:

```ts
  metadataBase: new URL(publicEnv().NEXT_PUBLIC_SITE_URL),
```

- [ ] **Step 4: Rodar testes e build**

```bash
npm test && npm run typecheck
```

Expected: PASS. (O build agora exige `.env.local`; criar a partir do `.env.example` conforme os Pré-requisitos antes de rodar `npm run build`.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts src/server src/instrumentation.ts .env.example src/app/layout.tsx
git commit -m "feat(env): validate public and server environment variables"
```

---

### Task 5: Design system — controles básicos

**Files:**
- Create: `src/components/ui/spinner.tsx`, `button.tsx`, `field.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`, `badge.tsx`, `container.tsx`, `index.ts`, `button.test.tsx`, `field.test.tsx`

**Interfaces:**
- Consumes: `cn` de `@/lib/cn`.
- Produces (exportados por `@/components/ui`):
  - `Spinner({ size?: 'sm' | 'md'; label?: string })`
  - `Button(props: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean })` — `type` padrão `'button'`
  - `Field({ label: string; error?: string | null; hint?: string; children: (control: FieldControlProps) => ReactNode })`, `type FieldControlProps = { id: string; 'aria-invalid': true | undefined; 'aria-describedby': string | undefined }`
  - `Input(ComponentProps<'input'>)`, `Select(ComponentProps<'select'>)`, `Checkbox(Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode })`
  - `Badge({ tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; children })`, `Container(ComponentProps<'div'>)`

- [ ] **Step 1: Escrever os testes**

`src/components/ui/button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('é type="button" por padrão para não submeter formulários sem querer', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
  })

  it('fica desabilitado e mostra spinner ao carregar', () => {
    render(<Button loading>Salvar</Button>)
    const button = screen.getByRole('button', { name: /salvar/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })
})
```

`src/components/ui/field.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './checkbox'
import { Field } from './field'
import { Input } from './input'

describe('Field', () => {
  it('associa o label ao controle', () => {
    render(<Field label="E-mail">{(control) => <Input {...control} />}</Field>)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('marca erro como inválido e descrito pela mensagem', () => {
    render(
      <Field label="CPF" error="CPF inválido." hint="Somente números">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText('CPF')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Somente números CPF inválido.')
    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido.')
  })
})

describe('Checkbox', () => {
  it('alterna ao clicar no texto', async () => {
    render(<Checkbox label="Quero novidades" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Quero novidades' })
    await userEvent.click(screen.getByText('Quero novidades'))
    expect(checkbox).toBeChecked()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — módulos de `src/components/ui` não existem.

- [ ] **Step 3: Implementar**

`src/components/ui/spinner.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function Spinner({ size = 'md', label = 'Carregando' }: { size?: 'sm' | 'md'; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        size === 'sm' ? 'size-3.5' : 'size-6',
      )}
    />
  )
}
```

`src/components/ui/button.tsx`:

```tsx
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-paper text-ink hover:bg-zinc-200',
  secondary: 'border border-line text-paper hover:border-paper',
  ghost: 'text-muted hover:text-paper',
  danger: 'bg-danger text-ink hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[10px]',
  md: 'h-11 px-5 text-xs',
  lg: 'h-14 px-8 text-sm',
}

export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  )
}
```

`src/components/ui/field.tsx`:

```tsx
// Sem 'use client': useId funciona em Server Components, e o render prop
// só pode ser passado por quem já está do mesmo lado.
import { useId } from 'react'

export type FieldControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | null
  hint?: string
  children: (control: FieldControlProps) => React.ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint ? (
        <p id={hintId} className="text-[10px] text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="font-mono text-[10px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
```

`src/components/ui/input.tsx`:

```tsx
import { cn } from '@/lib/cn'

export const controlClassName =
  'w-full border border-line bg-surface p-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-zinc-700 focus:border-paper aria-invalid:border-danger disabled:opacity-50'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlClassName, className)} {...props} />
}
```

`src/components/ui/select.tsx`:

```tsx
import { cn } from '@/lib/cn'
import { controlClassName } from './input'

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(controlClassName, 'cursor-pointer', className)} {...props} />
}
```

`src/components/ui/checkbox.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function Checkbox({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { label: React.ReactNode }) {
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="mt-0.5 accent-paper" {...props} />
      <span className="text-[10px] leading-relaxed text-muted transition-colors group-hover:text-paper">
        {label}
      </span>
    </label>
  )
}
```

`src/components/ui/badge.tsx`:

```tsx
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const tones: Record<Tone, string> = {
  neutral: 'border-line text-muted',
  success: 'border-success/30 bg-success/5 text-success',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  danger: 'border-danger/30 bg-danger/5 text-danger',
  info: 'border-info/30 bg-info/5 text-info',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
```

`src/components/ui/container.tsx`:

```tsx
import { cn } from '@/lib/cn'

export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-6', className)} {...props} />
}
```

`src/components/ui/index.ts`:

```ts
export { Badge } from './badge'
export { Button, type ButtonProps } from './button'
export { Checkbox } from './checkbox'
export { Container } from './container'
export { Field, type FieldControlProps } from './field'
export { Input } from './input'
export { Select } from './select'
export { Spinner } from './spinner'
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui
git commit -m "feat(ui): add button, field, input, select, checkbox, badge and container"
```

---

### Task 6: Design system — Modal, Drawer e Toast

**Files:**
- Create: `src/components/ui/dialog.tsx`, `src/components/ui/dialog.test.tsx`, `src/components/ui/toast.tsx`, `src/components/ui/toast.test.tsx`
- Modify: `src/components/ui/index.ts`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `cn`.
- Produces:
  - `Modal({ open: boolean; onClose: () => void; title: string; children; className? })`
  - `Drawer({ open: boolean; onClose: () => void; title: string; children; className? })` — mesmo contrato, painel lateral direito
  - `ToastProvider({ children, duration?: number })`, `useToast(): (toast: { message: string; tone?: 'success' | 'error' | 'info' }) => void`

- [ ] **Step 1: Escrever os testes**

`src/components/ui/dialog.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Drawer, Modal } from './dialog'

describe('Modal', () => {
  it('não mostra nada fechado', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Confirmar">
        conteúdo
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre com título acessível', () => {
    render(
      <Modal open onClose={() => {}} title="Confirmar exclusão">
        conteúdo
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Confirmar exclusão' })).toBeInTheDocument()
  })

  it('chama onClose pelo botão fechar', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Confirmar">
        conteúdo
      </Modal>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose quando o navegador fecha o dialog (Escape)', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Confirmar">
        conteúdo
      </Modal>,
    )
    fireEvent(screen.getByRole('dialog'), new Event('close'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Drawer', () => {
  it('abre com título acessível', () => {
    render(
      <Drawer open onClose={() => {}} title="Sua sacola">
        itens
      </Drawer>,
    )
    expect(screen.getByRole('dialog', { name: 'Sua sacola' })).toBeInTheDocument()
  })
})
```

`src/components/ui/toast.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './toast'

function Trigger() {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast({ message: 'Salvo!', tone: 'success' })}>
      salvar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mostra a mensagem e some após a duração', () => {
    render(
      <ToastProvider duration={1000}>
        <Trigger />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: 'salvar' }).click())
    expect(screen.getByText('Salvo!')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText('Salvo!')).not.toBeInTheDocument()
  })

  it('exige o provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger />)).toThrow('useToast deve ser usado dentro de ToastProvider')
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `./dialog` e `./toast` não existem.

- [ ] **Step 3: Implementar**

`src/components/ui/dialog.tsx`:

```tsx
'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/cn'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

const placements = {
  center: 'm-auto w-[min(100%-2rem,32rem)]',
  right: 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-md',
} as const

function BaseDialog({
  open,
  onClose,
  title,
  children,
  className,
  placement,
}: DialogProps & { placement: keyof typeof placements }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clique no backdrop: o alvo é o próprio <dialog>, não o conteúdo.
        if (event.target === event.currentTarget) onClose()
      }}
      className={cn(
        'border border-line bg-surface-2 p-0 text-paper backdrop:bg-black/80 backdrop:backdrop-blur-sm',
        placements[placement],
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-line p-6">
          <h2 id={titleId} className="text-sm font-black uppercase tracking-widest">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 text-muted transition-colors hover:text-paper"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  )
}

export function Modal(props: DialogProps) {
  return <BaseDialog {...props} placement="center" />
}

export function Drawer(props: DialogProps) {
  return <BaseDialog {...props} placement="right" />
}
```

`src/components/ui/toast.tsx`:

```tsx
'use client'

import { createContext, use, useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'error' | 'info'
type ToastInput = { message: string; tone?: Tone }
type ToastItem = { id: number; message: string; tone: Tone }

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

const tones: Record<Tone, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-line bg-surface-2 text-paper',
}

export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: React.ReactNode
  duration?: number
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback(
    ({ message, tone = 'info' }: ToastInput) => {
      const id = ++nextId.current
      setToasts((current) => [...current, { id, message, tone }])
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), duration)
    },
    [duration],
  )

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={cn(
              'border px-5 py-3 font-mono text-xs uppercase tracking-widest shadow-lg',
              tones[toast.tone],
            )}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const show = use(ToastContext)
  if (!show) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return show
}
```

Em `src/components/ui/index.ts`, acrescentar:

```ts
export { Drawer, Modal } from './dialog'
export { ToastProvider, useToast } from './toast'
```

Em `src/app/layout.tsx`, importar `import { ToastProvider } from '@/components/ui'` e trocar o `<body>` por:

```tsx
      <body className="min-h-dvh bg-ink font-sans text-paper antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui src/app/layout.tsx
git commit -m "feat(ui): add native dialog modal, drawer and toast"
```

---

### Task 7: Emulador do Firestore e regras "nega tudo"

> Requer o JDK dos Pré-requisitos (`java -version` deve responder).

**Files:**
- Create: `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `tests/rules/firestore.rules.test.ts`
- Modify: `package.json` (script `test:emulator`)

**Interfaces:**
- Produces: script `npm run test:emulator`, que sobe os emuladores (Firestore 8080, Auth 9099) e roda os projetos Vitest `rules` e `integration`.

- [ ] **Step 1: Instalar ferramentas do emulador**

```bash
npm install firebase@12
npm install -D firebase-tools @firebase/rules-unit-testing
```

(O `firebase` é dependência normal porque o cliente usa o módulo de auth na Task 11.)

- [ ] **Step 2: Configurar emuladores e regras**

`firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "singleProjectMode": true,
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 },
    "ui": { "enabled": false }
  }
}
```

`firestore.rules`:

```
rules_version = '2';

// Todo acesso a dados passa pelo servidor (Firebase Admin SDK), que ignora estas regras.
// Nenhum cliente lê ou grava o Firestore diretamente.
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

`firestore.indexes.json`:

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Escrever o teste das regras**

`tests/rules/firestore.rules.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, describe, it } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-streetstars',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

const paths = [
  'products/p1',
  'collections/c1',
  'users/u1',
  'orders/o1',
  'coupons/ESTRELA10',
  'counters/orders',
  'settings/store',
]

describe.each(paths)('%s', (path) => {
  it('nega leitura anônima', async () => {
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), path)))
  })

  it('nega leitura do próprio usuário', async () => {
    await assertFails(getDoc(doc(env.authenticatedContext('u1').firestore(), path)))
  })

  it('nega escrita mesmo com claim de admin', async () => {
    const db = env.authenticatedContext('admin', { admin: true }).firestore()
    await assertFails(setDoc(doc(db, path), { hacked: true }))
  })
})
```

- [ ] **Step 4: Adicionar o script e rodar**

Em `package.json`, acrescentar aos scripts:

```json
"test:emulator": "firebase emulators:exec --project demo-streetstars --only firestore,auth \"vitest run --project rules --project integration --passWithNoTests\""
```

Run: `npm run test:emulator`
Expected: os emuladores sobem e os 21 testes de regras passam (7 caminhos × 3 casos).

Para conferir que o teste pega regra errada: trocar temporariamente `if false` por `if true` em `firestore.rules`, rodar de novo e ver FAIL; depois desfazer com `git checkout firestore.rules`.

- [ ] **Step 5: Commit**

```bash
git add firebase.json firestore.rules firestore.indexes.json tests/rules package.json package-lock.json
git commit -m "feat(firestore): deny all client access and test rules on emulator"
```

---

### Task 8: Firebase Admin e repositório de usuários

**Files:**
- Create: `src/server/db/firebase-admin.ts`, `src/server/db/convert.ts`, `src/server/db/convert.test.ts`, `src/server/db/users.ts`, `tests/setup-integration.ts`, `tests/integration/helpers.ts`, `tests/integration/users.test.ts`

**Interfaces:**
- Consumes: `serverEnv()`.
- Produces:
  - `db(): Firestore`, `adminAuth(): Auth` em `@/server/db/firebase-admin`
  - `timestampsToDates(value: unknown): unknown`, `zodConverter<T>(schema: z.ZodType<T>): FirestoreDataConverter<T>` em `@/server/db/convert`
  - `addressSchema`, `userSchema`, `type Address`, `type UserDoc`, `getUser(uid: string): Promise<UserDoc | null>`, `ensureUser(input: { uid: string; email: string; name: string | null }): Promise<UserDoc>` em `@/server/db/users`
  - `clearFirestore(): Promise<void>` em `tests/integration/helpers.ts`

- [ ] **Step 1: Instalar o Admin SDK**

```bash
npm install firebase-admin@14
```

- [ ] **Step 2: Escrever o teste unitário do conversor**

`src/server/db/convert.test.ts`:

```ts
import { Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import { timestampsToDates } from './convert'

describe('timestampsToDates', () => {
  it('converte Timestamps aninhados em objetos e arrays', () => {
    const at = new Date('2026-01-02T03:04:05.000Z')
    const input = {
      createdAt: Timestamp.fromDate(at),
      history: [{ at: Timestamp.fromDate(at), status: 'paid' }],
      name: 'x',
      count: 2,
      empty: null,
    }
    expect(timestampsToDates(input)).toEqual({
      createdAt: at,
      history: [{ at, status: 'paid' }],
      name: 'x',
      count: 2,
      empty: null,
    })
  })
})
```

Run: `npm test` → Expected: FAIL (`./convert` não existe).

- [ ] **Step 3: Implementar Admin SDK e conversor**

`src/server/db/firebase-admin.ts`:

```ts
import 'server-only'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { serverEnv } from '@/server/env'

function adminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const env = serverEnv()
  // Com FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST definidos, o SDK usa os emuladores.
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    })
  }
  return initializeApp({ projectId: env.FIREBASE_PROJECT_ID })
}

export function db() {
  return getFirestore(adminApp())
}

export function adminAuth() {
  return getAuth(adminApp())
}
```

`src/server/db/convert.ts`:

```ts
import 'server-only'
import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import type { z } from 'zod'

export function timestampsToDates(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate()
  if (Array.isArray(value)) return value.map(timestampsToDates)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [key, timestampsToDates(inner)]),
    )
  }
  return value
}

/** Valida todo documento lido com o schema zod; Dates são gravadas como Timestamps. */
export function zodConverter<T extends DocumentData>(schema: z.ZodType<T>): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot: QueryDocumentSnapshot) =>
      schema.parse(timestampsToDates(snapshot.data())),
  }
}
```

Run: `npm test` → Expected: PASS.

- [ ] **Step 4: Escrever o teste de integração do repositório**

`tests/setup-integration.ts`:

```ts
process.env.FIREBASE_PROJECT_ID ??= 'demo-streetstars'
process.env.GCLOUD_PROJECT ??= 'demo-streetstars'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Testes de integração exigem o emulador: rode `npm run test:emulator`.')
}
```

`tests/integration/helpers.ts`:

```ts
export async function clearFirestore() {
  const host = process.env.FIRESTORE_EMULATOR_HOST
  const response = await fetch(
    `http://${host}/emulator/v1/projects/demo-streetstars/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  if (!response.ok) throw new Error(`Falha ao limpar o emulador: ${response.status}`)
}
```

`tests/integration/users.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/server/db/firebase-admin'
import { ensureUser, getUser } from '@/server/db/users'
import { clearFirestore } from './helpers'

beforeEach(clearFirestore)

describe('users repository', () => {
  it('getUser devolve null para quem não existe', async () => {
    expect(await getUser('nobody')).toBeNull()
  })

  it('ensureUser cria o perfil com valores padrão', async () => {
    const user = await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    expect(user).toMatchObject({
      name: 'Ana',
      email: 'a@b.com',
      phone: null,
      cpf: null,
      addresses: [],
      marketingConsent: { value: false },
    })
    expect(await getUser('u1')).toEqual(user)
  })

  it('ensureUser não sobrescreve um perfil existente', async () => {
    await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
    await db().doc('users/u1').update({ name: 'Ana Maria' })
    const again = await ensureUser({ uid: 'u1', email: 'a@b.com', name: 'Outro Nome' })
    expect(again.name).toBe('Ana Maria')
  })

  it('ensureUser aceita nome ausente (login sem nome)', async () => {
    const user = await ensureUser({ uid: 'u2', email: 'c@d.com', name: null })
    expect(user.name).toBe('')
  })
})
```

Run: `npm run test:emulator`
Expected: FAIL — `@/server/db/users` não existe.

- [ ] **Step 5: Implementar o repositório**

`src/server/db/users.ts`:

```ts
import 'server-only'
import { z } from 'zod'
import { zodConverter } from './convert'
import { db } from './firebase-admin'

export const addressSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  isDefault: z.boolean(),
})

export const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  cpf: z.string().nullable(),
  marketingConsent: z.object({ value: z.boolean(), at: z.date() }),
  addresses: z.array(addressSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Address = z.infer<typeof addressSchema>
export type UserDoc = z.infer<typeof userSchema>

const users = () => db().collection('users').withConverter(zodConverter(userSchema))

export async function getUser(uid: string): Promise<UserDoc | null> {
  const snapshot = await users().doc(uid).get()
  return snapshot.data() ?? null
}

export async function ensureUser(input: {
  uid: string
  email: string
  name: string | null
}): Promise<UserDoc> {
  const ref = users().doc(input.uid)
  return db().runTransaction(async (tx) => {
    const existing = (await tx.get(ref)).data()
    if (existing) return existing

    const now = new Date()
    const user: UserDoc = {
      name: input.name ?? '',
      email: input.email,
      phone: null,
      cpf: null,
      marketingConsent: { value: false, at: now },
      addresses: [],
      createdAt: now,
      updatedAt: now,
    }
    tx.create(ref, user)
    return user
  })
}
```

- [ ] **Step 6: Rodar tudo**

```bash
npm test && npm run test:emulator && npm run typecheck
```

Expected: PASS em unit, dom, rules e integration.

- [ ] **Step 7: Commit**

```bash
git add src/server/db tests/setup-integration.ts tests/integration package.json package-lock.json
git commit -m "feat(db): add firebase admin, zod converter and users repository"
```

---

### Task 9: Rate limit

**Files:**
- Create: `src/server/ratelimit.ts`, `src/server/ratelimit.test.ts`

**Interfaces:**
- Consumes: `serverEnv()`.
- Produces: `type RateLimitRule = { limit: number; windowSec: number }`, `rateLimit(identifier: string, rule: RateLimitRule): Promise<boolean>` (true = pode seguir), `clientIp(): Promise<string>`.

- [ ] **Step 1: Instalar**

```bash
npm install @upstash/ratelimit@2 @upstash/redis
```

- [ ] **Step 2: Escrever os testes**

`src/server/ratelimit.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const envMock = vi.hoisted(() => ({
  value: {} as { UPSTASH_REDIS_REST_URL?: string; UPSTASH_REDIS_REST_TOKEN?: string },
}))
const limitMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/env', () => ({ serverEnv: () => envMock.value }))
vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }))
vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn(function Ratelimit() {
    return { limit: limitMock }
  }) as unknown as { slidingWindow: () => unknown }
  Ratelimit.slidingWindow = vi.fn()
  return { Ratelimit }
})

import { rateLimit } from './ratelimit'

const rule = { limit: 5, windowSec: 60 }

describe('rateLimit', () => {
  beforeEach(() => {
    limitMock.mockReset()
    envMock.value = { UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' }
  })

  it('libera quando o Upstash não está configurado (desenvolvimento)', async () => {
    envMock.value = {}
    expect(await rateLimit('ip:1', rule)).toBe(true)
    expect(limitMock).not.toHaveBeenCalled()
  })

  it('bloqueia quando o limite estoura', async () => {
    limitMock.mockResolvedValue({ success: false })
    expect(await rateLimit('ip:1', rule)).toBe(false)
  })

  it('libera dentro do limite', async () => {
    limitMock.mockResolvedValue({ success: true })
    expect(await rateLimit('ip:1', rule)).toBe(true)
  })

  it('libera se o Redis falhar, para não derrubar vendas', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    limitMock.mockRejectedValue(new Error('redis down'))
    expect(await rateLimit('ip:1', rule)).toBe(true)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
```

Run: `npm test` → Expected: FAIL (`./ratelimit` não existe).

- [ ] **Step 3: Implementar**

`src/server/ratelimit.ts`:

```ts
import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'
import { serverEnv } from '@/server/env'

export type RateLimitRule = { limit: number; windowSec: number }

const limiters = new Map<string, Ratelimit>()

function limiterFor(rule: RateLimitRule): Ratelimit | null {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = serverEnv()
  // Em produção o env exige as duas variáveis; fora dela, sem Upstash não há limite.
  if (!url || !token) return null

  const key = `${rule.limit}/${rule.windowSec}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(rule.limit, `${rule.windowSec} s`),
      prefix: 'rl:streetstars',
    })
    limiters.set(key, limiter)
  }
  return limiter
}

export async function rateLimit(identifier: string, rule: RateLimitRule): Promise<boolean> {
  const limiter = limiterFor(rule)
  if (!limiter) return true
  try {
    const { success } = await limiter.limit(identifier)
    return success
  } catch (error) {
    console.error('rateLimit: falha no Redis, liberando requisição', error)
    return true
  }
}

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/ratelimit.ts src/server/ratelimit.test.ts package.json package-lock.json
git commit -m "feat(server): add upstash rate limiter with dev fallback"
```

---

### Task 10: Sessão no servidor, redirecionamento seguro e proxy

**Files:**
- Create: `src/lib/session-cookie.ts`, `src/lib/safe-next-path.ts`, `src/lib/safe-next-path.test.ts`, `src/server/auth/session.ts`, `src/server/auth/session.test.ts`, `src/proxy.ts`, `src/proxy.test.ts`

**Interfaces:**
- Consumes: `adminAuth()`, `ensureUser()`, `ok`/`fail`/`Result`.
- Produces:
  - `SESSION_COOKIE = '__session'`, `SESSION_MAX_AGE_SEC = 432000` (5 dias) em `@/lib/session-cookie`
  - `safeNextPath(input: string | null | undefined, fallback?: string): string` em `@/lib/safe-next-path`
  - Em `@/server/auth/session`: `type SessionUser = { uid: string; email: string | null; emailVerified: boolean; isAdmin: boolean }`, `createSession(idToken: string): Promise<Result<{ uid: string }>>`, `getSessionUser(): Promise<SessionUser | null>`, `requireUser(next?: string): Promise<SessionUser>`, `requireAdmin(): Promise<SessionUser>`, `destroySession(): Promise<void>`
  - `proxy(request: NextRequest)` e `config.matcher` em `src/proxy.ts`

- [ ] **Step 1: Escrever os testes de `safeNextPath` e do proxy**

`src/lib/safe-next-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  it.each([
    ['/conta', '/conta'],
    ['/admin/pedidos?status=paid', '/admin/pedidos?status=paid'],
    ['/produto/camiseta#medidas', '/produto/camiseta#medidas'],
  ])('mantém caminho interno %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each([
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'conta',
    '',
  ])('troca %s pelo fallback', (input) => {
    expect(safeNextPath(input, '/conta')).toBe('/conta')
  })

  it('usa / como fallback padrão para null', () => {
    expect(safeNextPath(null)).toBe('/')
  })
})
```

`src/proxy.test.ts`:

```ts
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { config, proxy } from './proxy'

describe('proxy', () => {
  it('manda para /entrar com o destino quando não há cookie de sessão', () => {
    const response = proxy(new NextRequest('http://localhost:3000/admin/pedidos?status=paid'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/entrar?next=%2Fadmin%2Fpedidos%3Fstatus%3Dpaid',
    )
  })

  it('deixa passar quando há cookie (a validação real é no servidor)', () => {
    const request = new NextRequest('http://localhost:3000/conta', {
      headers: { cookie: '__session=abc' },
    })
    expect(proxy(request).headers.get('location')).toBeNull()
  })

  it('protege só /conta e /admin', () => {
    expect(config.matcher).toEqual(['/conta/:path*', '/admin/:path*'])
  })
})
```

Run: `npm test` → Expected: FAIL (módulos não existem).

- [ ] **Step 2: Implementar `safeNextPath`, constantes do cookie e proxy**

`src/lib/session-cookie.ts`:

```ts
export const SESSION_COOKIE = '__session'
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 5
```

`src/lib/safe-next-path.ts`:

```ts
const BASE = 'http://internal.invalid'

/** Aceita só caminhos internos; qualquer coisa que leve a outro host vira o fallback. */
export function safeNextPath(input: string | null | undefined, fallback = '/'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) return fallback
  try {
    const url = new URL(input, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
```

`src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session-cookie'

// Barreira barata: só confere se o cookie existe. Quem valida a sessão de verdade
// é requireUser/requireAdmin no servidor, em toda página e Server Action.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/entrar'
  url.search = ''
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/conta/:path*', '/admin/:path*'],
}
```

Run: `npm test` → Expected: PASS nos testes de `safeNextPath` e do proxy.

- [ ] **Step 3: Escrever os testes da sessão**

`src/server/auth/session.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }))
const auth = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
  verifySessionCookie: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}))
const ensureUser = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))
vi.mock('@/server/db/firebase-admin', () => ({ adminAuth: () => auth }))
vi.mock('@/server/db/users', () => ({ ensureUser }))

import { createSession, getSessionUser, requireAdmin, requireUser } from './session'

const nowSec = () => Math.floor(Date.now() / 1000)

beforeEach(() => {
  vi.clearAllMocks()
  cookieStore.get.mockReturnValue(undefined)
})

describe('getSessionUser', () => {
  it('devolve null sem cookie', async () => {
    expect(await getSessionUser()).toBeNull()
  })

  it('lê uid, e-mail e claim de admin do cookie, checando revogação', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.com',
      email_verified: true,
      admin: true,
    })
    expect(await getSessionUser()).toEqual({
      uid: 'u1',
      email: 'a@b.com',
      emailVerified: true,
      isAdmin: true,
    })
    expect(auth.verifySessionCookie).toHaveBeenCalledWith('cookie', true)
  })

  it('devolve null se o cookie foi revogado ou o usuário desativado', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockRejectedValue(new Error('auth/session-cookie-revoked'))
    expect(await getSessionUser()).toBeNull()
  })
})

describe('requireUser / requireAdmin', () => {
  it('requireUser redireciona para /entrar com o destino', async () => {
    await expect(requireUser('/conta/pedidos')).rejects.toThrow(
      'REDIRECT:/entrar?next=%2Fconta%2Fpedidos',
    )
  })

  it('requireAdmin redireciona quem não está logado', async () => {
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/entrar?next=%2Fadmin')
  })

  it('requireAdmin responde 404 para usuário comum', async () => {
    cookieStore.get.mockReturnValue({ value: 'cookie' })
    auth.verifySessionCookie.mockResolvedValue({ uid: 'u1', email: 'a@b.com' })
    await expect(requireAdmin()).rejects.toThrow('NOT_FOUND')
  })
})

describe('createSession', () => {
  it('recusa ID token de login antigo, sem gravar cookie', async () => {
    auth.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', auth_time: nowSec() - 600 })
    const result = await createSession('token')
    expect(result).toEqual({
      ok: false,
      code: 'recent_login_required',
      message: 'Sua sessão expirou. Entre novamente.',
    })
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('recusa token inválido', async () => {
    auth.verifyIdToken.mockRejectedValue(new Error('auth/argument-error'))
    const result = await createSession('lixo')
    expect(result.ok).toBe(false)
    expect(cookieStore.set).not.toHaveBeenCalled()
  })

  it('grava cookie httpOnly e garante o perfil do usuário', async () => {
    auth.verifyIdToken.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.com',
      name: 'Ana',
      auth_time: nowSec(),
    })
    auth.createSessionCookie.mockResolvedValue('session-cookie')

    expect(await createSession('token')).toEqual({ ok: true, data: { uid: 'u1' } })
    expect(auth.createSessionCookie).toHaveBeenCalledWith('token', { expiresIn: 432000 * 1000 })
    expect(cookieStore.set).toHaveBeenCalledWith(
      '__session',
      'session-cookie',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 432000 }),
    )
    expect(ensureUser).toHaveBeenCalledWith({ uid: 'u1', email: 'a@b.com', name: 'Ana' })
  })
})
```

Run: `npm test` → Expected: FAIL (`./session` não existe).

- [ ] **Step 4: Implementar a sessão**

`src/server/auth/session.ts`:

```ts
import 'server-only'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import { fail, ok, type Result } from '@/lib/result'
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC } from '@/lib/session-cookie'
import { adminAuth } from '@/server/db/firebase-admin'
import { ensureUser } from '@/server/db/users'

export type SessionUser = {
  uid: string
  email: string | null
  emailVerified: boolean
  isAdmin: boolean
}

const RECENT_LOGIN_SEC = 5 * 60

export async function createSession(idToken: string): Promise<Result<{ uid: string }>> {
  let decoded
  try {
    decoded = await adminAuth().verifyIdToken(idToken)
  } catch {
    return fail('invalid_token', 'Não foi possível entrar. Tente novamente.')
  }

  // O Firebase só permite criar session cookie a partir de um login recente.
  if (Math.floor(Date.now() / 1000) - decoded.auth_time > RECENT_LOGIN_SEC) {
    return fail('recent_login_required', 'Sua sessão expirou. Entre novamente.')
  }
  if (!decoded.email) {
    return fail('email_required', 'Sua conta precisa ter um e-mail.')
  }

  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SEC * 1000,
  })
  const store = await cookies()
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  })

  const name = typeof decoded.name === 'string' ? decoded.name : null
  await ensureUser({ uid: decoded.uid, email: decoded.email, name })
  return ok({ uid: decoded.uid })
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  if (!value) return null
  try {
    const decoded = await adminAuth().verifySessionCookie(value, true)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      emailVerified: decoded.email_verified === true,
      isAdmin: decoded.admin === true,
    }
  } catch {
    return null
  }
})

export async function requireUser(next = '/conta'): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`)
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser('/admin')
  // 404 em vez de 403: não revela que a área existe.
  if (!user.isAdmin) notFound()
  return user
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  store.delete(SESSION_COOKIE)
  if (!value) return
  try {
    const decoded = await adminAuth().verifySessionCookie(value)
    await adminAuth().revokeRefreshTokens(decoded.sub)
  } catch {
    // Cookie já inválido: nada a revogar.
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/session-cookie.ts src/lib/safe-next-path.ts src/lib/safe-next-path.test.ts \
  src/server/auth src/proxy.ts src/proxy.test.ts
git commit -m "feat(auth): add session cookie, guards, safe redirects and proxy"
```

---

### Task 11: Login com e-mail e Google, e áreas provisórias

**Files:**
- Create: `src/lib/firebase-client.ts`, `src/features/auth/error-messages.ts`, `src/features/auth/error-messages.test.ts`, `src/features/auth/actions.ts`, `src/features/auth/sign-in-form.tsx`, `src/features/auth/sign-in-form.test.tsx`, `src/features/auth/sign-out-button.tsx`, `src/components/brand/logo.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/entrar/page.tsx`, `src/app/conta/page.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `publicEnv()`, `rateLimit`, `clientIp`, `createSession`, `destroySession`, `getSessionUser`, `requireUser`, `requireAdmin`, `safeNextPath`, `Button`, `Field`, `Input`.
- Produces:
  - `clientAuth(): Auth` em `@/lib/firebase-client` (persistência em memória; o estado de login vive só no cookie)
  - `authErrorMessage(code: string): string | null` (null = ignorar, ex.: popup fechado)
  - Server Actions `signInAction(idToken: string): Promise<Result<null>>` e `signOutAction(): Promise<void>`
  - `SignInForm({ next: string })`, `SignOutButton()`, `Logo({ className? })`

- [ ] **Step 1: Escrever o teste das mensagens de erro**

`src/features/auth/error-messages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './error-messages'

describe('authErrorMessage', () => {
  it.each(['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'])(
    'não revela se o e-mail existe (%s)',
    (code) => {
      expect(authErrorMessage(code)).toBe('E-mail ou senha incorretos.')
    },
  )

  it('ignora popup fechado pelo usuário', () => {
    expect(authErrorMessage('auth/popup-closed-by-user')).toBeNull()
    expect(authErrorMessage('auth/cancelled-popup-request')).toBeNull()
  })

  it('traduz bloqueio por excesso de tentativas', () => {
    expect(authErrorMessage('auth/too-many-requests')).toBe(
      'Muitas tentativas. Tente novamente em alguns minutos.',
    )
  })

  it('tem mensagem genérica para o resto', () => {
    expect(authErrorMessage('auth/qualquer-coisa')).toBe('Não foi possível entrar. Tente novamente.')
  })
})
```

Run: `npm test` → Expected: FAIL.

- [ ] **Step 2: Implementar mensagens, cliente Firebase e actions**

`src/features/auth/error-messages.ts`:

```ts
const messages: Record<string, string | null> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
}

export function authErrorMessage(code: string): string | null {
  return code in messages ? (messages[code] ?? null) : 'Não foi possível entrar. Tente novamente.'
}
```

`src/lib/firebase-client.ts`:

```ts
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserPopupRedirectResolver,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
import { publicEnv } from '@/lib/env'

let auth: Auth | undefined

/** Firebase no navegador serve só para autenticar; a sessão real é o cookie do servidor. */
export function clientAuth(): Auth {
  if (auth) return auth
  const env = publicEnv()
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
  // Síncrono de propósito: signInWithPopup precisa rodar no mesmo tique do clique.
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  })
  return auth
}
```

`src/features/auth/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { fail, ok, type Result } from '@/lib/result'
import { createSession, destroySession } from '@/server/auth/session'
import { clientIp, rateLimit } from '@/server/ratelimit'

export async function signInAction(idToken: string): Promise<Result<null>> {
  if (typeof idToken !== 'string' || idToken.length === 0 || idToken.length > 4096) {
    return fail('invalid_input', 'Requisição inválida.')
  }
  const ip = await clientIp()
  if (!(await rateLimit(`signin:${ip}`, { limit: 10, windowSec: 60 }))) {
    return fail('rate_limited', 'Muitas tentativas. Aguarde um minuto.')
  }
  const session = await createSession(idToken)
  return session.ok ? ok(null) : session
}

export async function signOutAction(): Promise<void> {
  await destroySession()
  redirect('/')
}
```

Run: `npm test` → Expected: PASS em `error-messages`.

- [ ] **Step 3: Escrever o teste do formulário**

`src/features/auth/sign-in-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
const firebase = vi.hoisted(() => ({
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
const signInAction = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('@/lib/firebase-client', () => ({ clientAuth: () => ({}) }))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
  ...firebase,
}))
vi.mock('./actions', () => ({ signInAction }))

import { SignInForm } from './sign-in-form'

const user = { getIdToken: vi.fn().mockResolvedValue('id-token') }

beforeEach(() => vi.clearAllMocks())

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('E-mail'), ' ana@b.com ')
  await userEvent.type(screen.getByLabelText('Senha'), 'segredo123')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('SignInForm', () => {
  it('cria a sessão e vai para o destino', async () => {
    firebase.signInWithEmailAndPassword.mockResolvedValue({ user })
    signInAction.mockResolvedValue({ ok: true, data: null })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'ana@b.com', 'segredo123')
    expect(signInAction).toHaveBeenCalledWith('id-token')
    expect(firebase.signOut).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/conta')
  })

  it('mostra o erro do servidor e não navega', async () => {
    firebase.signInWithEmailAndPassword.mockResolvedValue({ user })
    signInAction.mockResolvedValue({
      ok: false,
      code: 'rate_limited',
      message: 'Muitas tentativas. Aguarde um minuto.',
    })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas. Aguarde um minuto.')
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('traduz erro de credencial do Firebase', async () => {
    firebase.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/invalid-credential' })
    render(<SignInForm next="/conta" />)

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(signInAction).not.toHaveBeenCalled()
  })

  it('entra com Google', async () => {
    firebase.signInWithPopup.mockResolvedValue({ user })
    signInAction.mockResolvedValue({ ok: true, data: null })
    render(<SignInForm next="/admin" />)

    await userEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }))

    expect(firebase.signInWithPopup).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/admin')
  })
})
```

Run: `npm test` → Expected: FAIL (`./sign-in-form` não existe).

- [ ] **Step 4: Implementar o formulário e o botão de sair**

`src/features/auth/sign-in-form.tsx`:

```tsx
'use client'

import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Field, Input } from '@/components/ui'
import { clientAuth } from '@/lib/firebase-client'
import { signInAction } from './actions'
import { authErrorMessage } from './error-messages'

type Pending = 'password' | 'google' | null

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
}

export function SignInForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)

  async function run(kind: Exclude<Pending, null>, signIn: () => Promise<UserCredential>) {
    setError(null)
    setPending(kind)
    try {
      const credential = await signIn()
      const result = await signInAction(await credential.user.getIdToken())
      await signOut(clientAuth())
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.replace(next)
      router.refresh()
    } catch (err) {
      const message = authErrorMessage(errorCode(err))
      if (message) setError(message)
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          void run('password', () =>
            signInWithEmailAndPassword(clientAuth(), email.trim(), password),
          )
        }}
      >
        <Field label="E-mail">
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          )}
        </Field>
        <Field label="Senha">
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        {error ? (
          <p role="alert" className="border border-danger/20 bg-danger/10 p-3 text-center text-xs text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={pending === 'password'} disabled={pending !== null}>
          Entrar
        </Button>
      </form>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        loading={pending === 'google'}
        disabled={pending !== null}
        onClick={() => void run('google', () => signInWithPopup(clientAuth(), new GoogleAuthProvider()))}
      >
        Entrar com Google
      </Button>
    </div>
  )
}
```

`src/features/auth/sign-out-button.tsx`:

```tsx
import { Button } from '@/components/ui'
import { signOutAction } from './actions'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Sair
      </Button>
    </form>
  )
}
```

Run: `npm test` → Expected: PASS.

- [ ] **Step 5: Portar o logo**

```bash
mkdir -p src/components/brand
cp legacy/src/components/ui/Logo.jsx src/components/brand/logo.tsx
```

Em `src/components/brand/logo.tsx`, trocar a primeira linha:

```tsx
export default function Logo({ className }) {
```

por:

```tsx
export function Logo({ className }: { className?: string }) {
```

e, na tag `<svg`, acrescentar `role="img"` e `aria-label="Street Stars"`. O resto do arquivo (os `<path>`) fica igual.

- [ ] **Step 6: Criar as páginas**

`src/app/(auth)/layout.tsx`:

```tsx
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <Link href="/" className="mb-10 transition-opacity hover:opacity-80">
          <Logo className="h-12 w-auto text-paper md:h-16" />
        </Link>
        {children}
      </div>
    </div>
  )
}
```

`src/app/(auth)/entrar/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/features/auth/sign-in-form'
import { safeNextPath } from '@/lib/safe-next-path'
import { getSessionUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const { next } = await searchParams
  const nextPath = safeNextPath(typeof next === 'string' ? next : null, '/conta')
  if (await getSessionUser()) redirect(nextPath)

  return (
    <div className="w-full border border-line bg-surface-2/80 p-8 shadow-2xl backdrop-blur-md">
      <h1 className="mb-6 border-b border-line pb-4 text-sm font-bold uppercase tracking-widest">
        Entrar
      </h1>
      <SignInForm next={nextPath} />
    </div>
  )
}
```

`src/app/conta/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Minha conta', robots: { index: false } }

// Provisória: a área do cliente completa chega na Fase 4.
export default async function AccountPage() {
  const user = await requireUser('/conta')
  return (
    <Container className="flex flex-col gap-6 py-16">
      <h1 className="text-2xl font-black uppercase italic tracking-tighter">Minha conta</h1>
      <p className="font-mono text-xs text-muted">{user.email}</p>
      <SignOutButton />
    </Container>
  )
}
```

`src/app/admin/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Container } from '@/components/ui'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { requireAdmin } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Admin', robots: { index: false } }

// Provisória: o painel completo chega na Fase 5.
export default async function AdminPage() {
  const admin = await requireAdmin()
  return (
    <Container className="flex flex-col gap-6 py-16">
      <h1 className="text-3xl font-black uppercase italic tracking-tighter">Painel</h1>
      <p className="font-mono text-xs text-muted">Admin: {admin.email}</p>
      <SignOutButton />
    </Container>
  )
}
```

- [ ] **Step 7: Verificar**

```bash
npm test && npm run lint && npm run typecheck && npm run build
```

Expected: tudo PASS; o build lista `/entrar`, `/conta` e `/admin` como dinâmicas (ƒ).

Manual (com `.env.local` do projeto dev):
1. `npm run dev`, abrir `/conta` → redireciona para `/entrar?next=%2Fconta`.
2. Criar um usuário de teste em Authentication no console do Firebase dev; entrar com e-mail e senha → cai em `/conta` mostrando o e-mail.
3. "Sair" → volta para `/`; abrir `/conta` de novo → pede login.
4. "Entrar com Google" → popup do Google → cai em `/conta`.
5. Abrir `/admin` logado como usuário comum → página 404.
6. No console do Firestore dev, conferir que `users/{uid}` foi criado.

- [ ] **Step 8: Commit**

```bash
git add src/lib/firebase-client.ts src/features src/components/brand src/app
git commit -m "feat(auth): add email and google sign-in with placeholder account and admin pages"
```

---

### Task 12: Script para conceder admin

**Files:**
- Create: `scripts/grant-admin.ts`
- Modify: `package.json` (script `grant-admin`)

**Interfaces:**
- Consumes: variáveis `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` do `.env.local`.
- Produces: `npm run grant-admin -- <email>`.

- [ ] **Step 1: Instalar o tsx**

```bash
npm install -D tsx
```

- [ ] **Step 2: Escrever o script**

`scripts/grant-admin.ts`:

```ts
// Uso: npm run grant-admin -- pessoa@exemplo.com
// Roda fora do Next, por isso inicializa o Admin SDK por conta própria (sem 'server-only').
import { cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Uso: npm run grant-admin -- <email>')
    process.exit(1)
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.error('Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no .env.local')
    process.exit(1)
  }

  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })

  const auth = getAuth()
  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true })
  // Invalida a sessão atual: o próximo login já carrega a claim de admin.
  await auth.revokeRefreshTokens(user.uid)

  console.log(`✓ ${email} agora é admin no projeto ${FIREBASE_PROJECT_ID}. Peça para entrar novamente.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Em `package.json`, acrescentar aos scripts:

```json
"grant-admin": "tsx --env-file=.env.local scripts/grant-admin.ts"
```

- [ ] **Step 3: Verificar**

```bash
npm run typecheck
npm run grant-admin
```

Expected: typecheck PASS; sem e-mail, o script imprime `Uso: npm run grant-admin -- <email>` e sai com código 1.

Manual: `npm run grant-admin -- <email do usuário de teste>` → mensagem de sucesso; em `/conta` a sessão antiga é recusada (pede login); após entrar de novo, `/admin` mostra "Painel".

- [ ] **Step 4: Commit**

```bash
git add scripts/grant-admin.ts package.json package-lock.json
git commit -m "feat(scripts): add grant-admin script for admin custom claim"
```

---

### Task 13: Headers de segurança e CSP

**Files:**
- Create: `src/lib/security-headers.ts`, `src/lib/security-headers.test.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `securityHeaders(options: { isDev: boolean }): { key: string; value: string }[]`.

- [ ] **Step 1: Escrever o teste**

`src/lib/security-headers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { securityHeaders } from './security-headers'

const csp = (isDev: boolean) =>
  securityHeaders({ isDev }).find((h) => h.key === 'Content-Security-Policy')?.value ?? ''

describe('securityHeaders', () => {
  it('bloqueia o site em iframes e restringe objetos', () => {
    expect(csp(false)).toContain("frame-ancestors 'none'")
    expect(csp(false)).toContain("object-src 'none'")
  })

  it('libera o popup do Google e o Cloudinary', () => {
    expect(csp(false)).toContain('https://*.firebaseapp.com')
    expect(csp(false)).toContain('https://apis.google.com')
    expect(csp(false)).toContain('https://res.cloudinary.com')
  })

  it("só usa 'unsafe-eval' em desenvolvimento (React Refresh)", () => {
    expect(csp(false)).not.toContain("'unsafe-eval'")
    expect(csp(true)).toContain("'unsafe-eval'")
  })

  it('inclui os headers de proteção básicos', () => {
    const keys = securityHeaders({ isDev: false }).map((h) => h.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ]),
    )
  })
})
```

Run: `npm test` → Expected: FAIL.

- [ ] **Step 2: Implementar e aplicar no Next**

`src/lib/security-headers.ts`:

```ts
// CSP estática (sem nonce) para manter o ISR das páginas da loja — ver spec, seção 9.
export function securityHeaders({ isDev }: { isDev: boolean }) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.google.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
    'frame-src https://*.firebaseapp.com https://accounts.google.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  return [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'
import { securityHeaders } from './src/lib/security-headers'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({ isDev: process.env.NODE_ENV === 'development' }),
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 3: Verificar**

```bash
npm test && npm run build
```

Manual: `npm run dev`, abrir `/entrar`, DevTools → Network → documento → conferir o header `Content-Security-Policy`; no Console, nenhuma violação de CSP; "Entrar com Google" continua funcionando.

- [ ] **Step 4: Commit**

```bash
git add src/lib/security-headers.ts src/lib/security-headers.test.ts next.config.ts
git commit -m "feat(security): add static csp and security headers"
```

---

### Task 14: CI no GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Escrever o workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    env:
      # Valores de mentira: o build não fala com serviços reais.
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
      NEXT_PUBLIC_FIREBASE_API_KEY: ci
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: demo-streetstars.firebaseapp.com
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: demo-streetstars
      NEXT_PUBLIC_FIREBASE_APP_ID: ci
      FIREBASE_PROJECT_ID: demo-streetstars
      FIREBASE_CLIENT_EMAIL: ci@demo-streetstars.iam.gserviceaccount.com
      FIREBASE_PRIVATE_KEY: ci
      UPSTASH_REDIS_REST_URL: https://ci.upstash.io
      UPSTASH_REDIS_REST_TOKEN: ci
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run typecheck
      - run: npm test
      - run: npm run test:emulator
      - run: npm run build
```

- [ ] **Step 2: Verificar localmente o que o CI roda**

```bash
npm ci && npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:emulator && npm run build
```

Expected: tudo PASS. (O workflow só roda no GitHub depois de um push, que acontece apenas quando o usuário pedir.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint, typecheck, tests, emulator and build workflow"
```

---

### Task 15: README e revisão da branch

**Files:**
- Create: `README.md`

- [ ] **Step 1: Escrever o README**

`README.md`:

````markdown
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
cp .env.example .env.local   # preencha com o projeto Firebase dev
npm run dev
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` · `npm run typecheck` · `npm run format` | Qualidade de código |
| `npm test` | Testes unitários e de componentes |
| `npm run test:emulator` | Testes de regras e integração no emulador do Firebase |
| `npm run grant-admin -- <email>` | Torna um usuário admin (ele precisa entrar de novo) |

## Regras do projeto

- Só o servidor acessa o Firestore (Admin SDK); as regras negam todo acesso de cliente.
- Dinheiro sempre em centavos inteiros.
- Código de servidor fica em `src/server` e importa `server-only`.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add readme for the next.js app"
```

- [ ] **Step 3: Revisão da branch contra a main (skill `git-flow`, seção 5)**

```bash
git fetch origin main
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git log --oneline HEAD..origin/main
git merge-tree --write-tree origin/main HEAD
npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:emulator && npm run build
```

Montar o relatório no formato da skill. Pontos de atenção obrigatórios:
- **Riscos:** a `main` em produção não muda (nada foi enviado); a branch troca toda a stack e as variáveis de ambiente (novos nomes, `NEXT_PUBLIC_*`); as `firestore.rules` novas negam tudo e **não podem** ser publicadas no projeto de produção até a Fase 5, porque o app antigo da `main` depende das regras antigas.
- **Conflitos:** a `main` não deve ter avançado; se avançou, avisar.

Não fazer push nem PR: perguntar ao usuário.
