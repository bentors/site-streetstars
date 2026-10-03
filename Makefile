# Atalhos do projeto. `make` sem argumentos lista os comandos.
# No Windows, rode a partir do Git Bash (os scripts são bash).
SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
MAKEFLAGS += --no-print-directory

EMAIL ?=
SHELLCHECK_IMAGE := koalaman/shellcheck:v0.10.0

.PHONY: help setup doctor dev build start lint format format-check typecheck test test-emulator \
	check lint-sh emulators-up emulators-down emulators-logs grant-admin clean

help: ## Lista os comandos disponíveis
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

## ── Ambiente ────────────────────────────────────────────────
setup: ## Prepara o ambiente: confere ferramentas, cria .env.local e instala dependências
	@bash scripts/bootstrap.sh

doctor: ## Diagnóstico de ferramentas, variáveis e portas
	@bash scripts/doctor.sh

## ── App ─────────────────────────────────────────────────────
dev: ## Servidor de desenvolvimento (http://localhost:3000)
	npm run dev

build: ## Build de produção
	npm run build

start: ## Sobe o build de produção
	npm run start

## ── Qualidade ───────────────────────────────────────────────
lint: ## ESLint
	npm run lint

format: ## Formata o código com Prettier
	npm run format

format-check: ## Confere a formatação sem alterar arquivos
	npm run format:check

typecheck: ## Checagem de tipos do TypeScript
	npm run typecheck

test: ## Testes unitários e de componentes
	npm test

test-emulator: ## Testes de regras e integração (Java local ou container)
	@bash scripts/test-emulator.sh

lint-sh: ## Valida os scripts .sh com shellcheck (via Docker)
	MSYS_NO_PATHCONV=1 docker run --rm -v "$(CURDIR):/mnt" -w /mnt $(SHELLCHECK_IMAGE) -x scripts/*.sh docker/firebase/entrypoint.sh

check: ## Tudo o que o CI roda, na mesma ordem
	@$(MAKE) lint
	@$(MAKE) format-check
	@$(MAKE) typecheck
	@$(MAKE) test
	@$(MAKE) test-emulator
	@$(MAKE) build

## ── Emuladores (Docker) ─────────────────────────────────────
emulators-up: ## Sobe Firestore (8080), Auth (9099) e a UI (http://localhost:4000)
	docker compose up -d --build --wait firebase
	@echo "UI dos emuladores: http://localhost:4000"

emulators-down: ## Para os emuladores (os dados ficam em .emulator-data/)
	docker compose down

emulators-logs: ## Acompanha os logs dos emuladores
	docker compose logs -f firebase

## ── Operação ────────────────────────────────────────────────
grant-admin: ## Torna um usuário admin: make grant-admin EMAIL=pessoa@exemplo.com
	@test -n "$(EMAIL)" || { echo "Uso: make grant-admin EMAIL=pessoa@exemplo.com"; exit 1; }
	npm run grant-admin -- "$(EMAIL)"

clean: ## Apaga artefatos locais (.next, coverage, dados dos emuladores)
	rm -rf .next coverage .emulator-data
