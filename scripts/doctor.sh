#!/usr/bin/env bash
# Diagnóstico do ambiente: ferramentas, variáveis do .env.local (só nomes) e portas.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
source scripts/lib.sh

problems=0
problem() {
  printf '%s✗%s %s\n' "$c_red" "$c_reset" "$*"
  problems=$((problems + 1))
}

echo "Ferramentas"
if node_ok; then ok "node $(node -v)"; else problem "node >= 20.9 ausente"; fi
if has npm; then ok "npm $(npm -v)"; else problem "npm ausente"; fi
if has make; then ok "$(make --version | head -n 1)"; else warn "make ausente (opcional; os scripts rodam direto)"; fi
if java_ok; then
  ok "java $(java -version 2>&1 | head -n 1 | sed -E 's/.*version "([^"]+)".*/\1/')"
else
  warn "java 21 ausente (opcional se o Docker estiver rodando)"
fi
if docker_running; then
  ok "docker $(docker version --format '{{.Server.Version}}') rodando"
elif has docker; then
  warn "docker instalado, mas o daemon não está rodando (abra o Docker Desktop)"
else
  warn "docker ausente (opcional se houver Java 21)"
fi
if ! java_ok && ! docker_running; then problem "make test-emulator precisa de Java 21 ou do Docker rodando"; fi

echo
echo "Variáveis do .env.local"
if [[ ! -f .env.local ]]; then
  problem ".env.local não existe (rode make setup)"
else
  while IFS= read -r key; do
    value=$(grep -E "^${key}=" .env.local | head -n 1 | cut -d= -f2-)
    value=${value//\"/}
    if [[ -n "$value" ]]; then
      ok "$key"
    elif [[ "$key" =~ ^(UPSTASH_|MERCADOPAGO_|MELHORENVIO_|RESEND_|EMAIL_FROM|CRON_SECRET|CLOUDINARY_|NEXT_PUBLIC_CLOUDINARY_) ]]; then
      info "  $key vazio (opcional em desenvolvimento)"
    else
      problem "$key vazio"
    fi
  done < <(grep -oE '^[A-Z0-9_]+' .env.example)
fi

echo
echo "Portas"
for port in 3000 4000 8080 9099; do
  if port_in_use "$port"; then info "  $port em uso"; else info "  $port livre"; fi
done

echo
if ((problems > 0)); then
  fail "$problems problema(s) encontrado(s)"
fi
ok "Ambiente ok"
