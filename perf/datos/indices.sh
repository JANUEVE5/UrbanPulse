#!/usr/bin/env bash
# ./perf/datos/indices.sh crear | quitar
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case "${1:-}" in
  crear) "$DIR/psql.sh" < "$DIR/indices.sql" ;;
  quitar) "$DIR/psql.sh" < "$DIR/quitar-indices.sql" ;;
  *) echo "Uso: indices.sh crear|quitar" >&2; exit 1 ;;
esac
