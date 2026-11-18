#!/usr/bin/env bash
# Sustituye las incidencias por N incidencias sintéticas (experimento 4b).
#   ./perf/datos/cargar-volumen.sh 100000
# OJO: el backend recrea el esquema y data.sql en cada arranque (ADR-006). Carga el volumen DESPUÉS de
# arrancar el backend y no lo reinicies entre ejecuciones del mismo tamaño.
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
N="${1:?Uso: cargar-volumen.sh <numero-de-incidencias>}"
echo "Cargando $N incidencias…"
time "$DIR/psql.sh" -v total="$N" < "$DIR/generar-incidencias.sql"
