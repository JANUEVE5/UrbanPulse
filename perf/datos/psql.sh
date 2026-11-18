#!/usr/bin/env bash
# Ejecuta psql contra la base de datos de UrbanPulse.
# Por defecto usa el contenedor de compose.yaml; con PSQL="psql -h ... -U ... -d ..." se usa otro cliente.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ -n "${PSQL:-}" ]]; then
  exec $PSQL -v ON_ERROR_STOP=1 "$@"
fi
cd "$ROOT"
exec docker compose exec -T postgres psql -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-urbanpulse}" "$@"
