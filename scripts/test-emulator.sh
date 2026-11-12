#!/usr/bin/env bash
# Roda os testes de regras e integração contra os emuladores do Firebase.
# Usa o Java local se houver (como no CI); senão, sobe um container descartável.
# USE_DOCKER=1 força o container mesmo com Java instalado.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/lib.sh

if [[ "${USE_DOCKER:-0}" != "1" ]] && java_ok; then
  info "Java 21 encontrado: usando emuladores locais"
  exec npm run test:emulator
fi

docker_running || fail "Precisa de Java 21 ou do Docker rodando para os emuladores (veja make doctor)."
for port in 8080 9099; do
  if port_in_use "$port"; then
    fail "Porta $port ocupada. Se forem os emuladores de dev, pare com make emulators-down."
  fi
done

# Projeto compose separado e sem persistência: os testes apagam o banco a cada caso.
export COMPOSE_PROJECT_NAME=streetstars-test
export EMULATOR_PERSIST=0
cleanup() { docker compose down --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

info "Subindo emuladores em container..."
docker compose up -d --wait firebase

FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
  FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npx vitest run --project rules --project integration
