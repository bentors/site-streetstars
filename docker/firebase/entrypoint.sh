#!/usr/bin/env bash
# Sobe os emuladores. Com EMULATOR_PERSIST=1, importa e exporta os dados em /data/export
# (/data é montado em .emulator-data/ no host) para sobreviverem a reinícios.
# Exporta numa subpasta porque o firebase troca o diretório inteiro ao exportar, e um
# ponto de montagem não pode ser substituído ("Device or resource busy").
set -euo pipefail

args=(emulators:start --project demo-streetstars)

if [[ "${EMULATOR_PERSIST:-1}" == "1" ]]; then
  export_dir=/data/export
  if [[ -f "$export_dir/firebase-export-metadata.json" ]]; then
    args+=(--import="$export_dir")
  fi
  args+=(--export-on-exit="$export_dir")
fi

# exec: o firebase recebe o SIGTERM do `docker compose down` e exporta antes de sair.
exec firebase "${args[@]}"
