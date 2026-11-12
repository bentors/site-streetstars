#!/usr/bin/env bash
# Funções compartilhadas pelos scripts. Uso: source "$(dirname "$0")/lib.sh"

if [[ -t 1 ]]; then
  c_green=$'\e[32m' c_yellow=$'\e[33m' c_red=$'\e[31m' c_dim=$'\e[2m' c_reset=$'\e[0m'
else
  c_green='' c_yellow='' c_red='' c_dim='' c_reset=''
fi

ok() { printf '%s✓%s %s\n' "$c_green" "$c_reset" "$*"; }
warn() { printf '%s!%s %s\n' "$c_yellow" "$c_reset" "$*"; }
info() { printf '%s%s%s\n' "$c_dim" "$*" "$c_reset"; }
fail() {
  printf '%s✗%s %s\n' "$c_red" "$c_reset" "$*" >&2
  exit 1
}

has() { command -v "$1" >/dev/null 2>&1; }

# Versão "maior" de um executável que imprime algo como "v24.12.0" ou "21.0.12".
major_version() { sed -E 's/[^0-9]*([0-9]+).*/\1/' <<<"$1"; }

# Node >= 20.9 (mínimo do Next 16).
node_ok() {
  has node || return 1
  node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 20 || (a === 20 && b >= 9) ? 0 : 1)'
}

# Java >= 21 (exigido pelos emuladores do firebase-tools).
java_ok() {
  has java || return 1
  local version
  version=$(java -version 2>&1 | head -n 1 | sed -E 's/.*version "([^"]+)".*/\1/')
  [[ $(major_version "$version") -ge 21 ]]
}

docker_running() { has docker && docker info >/dev/null 2>&1; }

port_in_use() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }
