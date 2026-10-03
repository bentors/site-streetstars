#!/usr/bin/env bash
# Prepara o ambiente de desenvolvimento: confere ferramentas, cria o .env.local e instala dependências.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/lib.sh

node_ok || fail "Node >= 20.9 é obrigatório (recomendado: Node 24). Versão atual: $(node -v 2>/dev/null || echo 'não instalado')"
ok "Node $(node -v)"

if [[ -f .env.local ]]; then
  ok ".env.local já existe"
else
  cp .env.example .env.local
  warn ".env.local criado a partir do .env.example: preencha os valores antes de rodar o app."
fi

# npm ci apaga node_modules; no Windows, um servidor rodando trava arquivos nativos e deixa a
# instalação pela metade.
if port_in_use 3000; then
  fail "Porta 3000 em uso: pare o servidor de desenvolvimento antes de rodar make setup."
fi

info "Instalando dependências (npm ci)..."
npm ci

if docker_running; then
  ok "Docker rodando: make emulators-up e make test-emulator usam o container"
elif java_ok; then
  ok "Java 21 encontrado: make test-emulator usa os emuladores locais"
else
  warn "Sem Docker rodando e sem Java 21: make test-emulator não vai funcionar até um dos dois estar disponível."
fi

ok "Pronto. Rode make doctor para conferir o ambiente ou make dev para começar."
