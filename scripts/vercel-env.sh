#!/usr/bin/env bash
# Cadastra na Vercel as variáveis de um arquivo .env, sem exibir os valores.
# Uso: bash scripts/vercel-env.sh <arquivo> <preview|production> [branch]
#
# Com branch, a variável vale só para os previews dessa branch e tem prioridade sobre a de
# Preview geral; as variáveis compartilhadas com Production não são tocadas.
# NEXT_PUBLIC_* vão para o navegador de qualquer forma; as demais são criadas como Sensitive
# (só escrita: depois de criadas, nem o painel nem a CLI mostram o valor).
set -euo pipefail
cd "$(dirname "$0")/.." || exit 1
source scripts/lib.sh

file=${1:-}
target=${2:-}
branch=${3:-}
[[ -f $file ]] || fail "Uso: bash scripts/vercel-env.sh <arquivo> <preview|production> [branch]"
[[ $target == preview || $target == production ]] || fail "Ambiente deve ser preview ou production"
[[ -z $branch || $target == preview ]] || fail "Branch só vale para preview"

args=("$target")
# --force substitui só o registro do mesmo ambiente e branch; sem branch, um conflito com
# variável compartilhada falha em vez de sobrescrever o valor da produção.
if [[ -n $branch ]]; then args+=("$branch" --force); fi

count=0
while IFS= read -r line || [[ -n $line ]]; do
  [[ $line =~ ^[[:space:]]*(#|$) ]] && continue
  [[ $line =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]] || fail "Linha inválida (só o nome é mostrado): ${line%%=*}"
  name=${BASH_REMATCH[1]}
  value=${BASH_REMATCH[2]}
  # Aspas envolvendo o valor inteiro são do formato .env, não do valor.
  if [[ $value =~ ^\"(.*)\"$ || $value =~ ^\'(.*)\'$ ]]; then value=${BASH_REMATCH[1]}; fi
  [[ -z $value ]] && {
    warn "$name vazio, ignorado"
    continue
  }

  extra=()
  [[ $name == NEXT_PUBLIC_* ]] || extra=(--sensitive)
  # Valor pelo stdin: não aparece na lista de processos nem no histórico do shell.
  if printf '%s' "$value" | npx --yes vercel env add "$name" "${args[@]}" "${extra[@]}" --yes >/dev/null 2>&1; then
    ok "$name"
    count=$((count + 1))
  else
    fail "$name falhou. Rode sem o >/dev/null para ver o motivo: npx vercel env add $name ${args[*]}"
  fi
done <"$file"

info "$count variáveis cadastradas em $target${branch:+ ($branch)}."
