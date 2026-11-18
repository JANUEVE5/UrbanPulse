#!/usr/bin/env bash
# Lanza la batería completa de un experimento (todas sus configuraciones × REPS repeticiones).
#
#   ./perf/experimentos.sh smoke | exp1 | exp2a | exp2b | exp2c | exp3 | exp4a | exp4b | todo
#
# Requisitos: backend en BASE_URL (http://localhost:8080) y, para exp4b, acceso a la base de datos
# (perf/datos/psql.sh). Reinicia el backend antes de cada experimento para partir de data.sql
# (salvo en exp4b, que carga sus propios datos).
#
# Configuración (variables de entorno, con sus valores por defecto):
#   REPS=3  COOLDOWN=30  WARMUP=30s
#   EXP1_OPS="listar mapa listar_filtrado detalle crear cambiar_estado cambiar_prioridad comentar activos_cercanos login"
#   EXP2_VUS="10 25 50 100"    EXP2_RATES="25 50 100 150 200"   EXP2_OP=mixto
#   EXP3_MAP_VUS="0 50 100"
#   EXP4B_VOLUMES="1000 10000 100000 1000000"
set -euo pipefail
PERF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN="$PERF/run.sh"
WARMUP="${WARMUP:-30s}"

warmup() {
  [[ "$WARMUP" == "0" ]] && return
  echo "» Calentamiento ($WARMUP) para estabilizar JVM y cachés…"
  DURATION="$WARMUP" "${K6:-k6}" run --quiet "$PERF/experimentos/00-smoke.js" >/dev/null 2>&1 || {
    echo "La prueba de humo falla: ejecuta ./perf/experimentos.sh smoke para ver el motivo." >&2; exit 1; }
}

smoke() { REPS=1 "$RUN" experimentos/00-smoke.js smoke; }

exp1() {
  warmup
  for op in ${EXP1_OPS:-listar mapa listar_filtrado detalle crear cambiar_estado cambiar_prioridad comentar activos_cercanos login}; do
    OP="$op" "$RUN" experimentos/exp1-linea-base.js "op-$op"
  done
}

exp2a() {
  warmup
  for vus in ${EXP2_VUS:-10 25 50 100}; do
    VUS="$vus" OP="${EXP2_OP:-mixto}" "$RUN" experimentos/exp2a-capacidad-vus.js "vus-$vus"
  done
}

exp2b() {
  warmup
  for rate in ${EXP2_RATES:-25 50 100 150 200}; do
    RATE="$rate" OP="${EXP2_OP:-mixto}" "$RUN" experimentos/exp2b-tasa-constante.js "rate-$rate"
  done
}

exp2c() {
  warmup
  OP="${EXP2_OP:-mixto}" "$RUN" experimentos/exp2c-tasa-creciente.js "rampa"
}

exp3() {
  warmup
  for map in ${EXP3_MAP_VUS:-0 50 100}; do
    MAP_VUS="$map" "$RUN" experimentos/exp3-pico-emergencia.js "mapa-$map"
  done
}

exp4a() {
  warmup
  READ_RATE=${EXP4A_READ:-50} CREATE_RATE=0 UPDATE_RATE=0 "$RUN" experimentos/exp4a-lectura-escritura.js solo-lectura
  READ_RATE=0 CREATE_RATE=${EXP4A_CREATE:-10} UPDATE_RATE=${EXP4A_UPDATE:-10} "$RUN" experimentos/exp4a-lectura-escritura.js solo-escritura
  READ_RATE=${EXP4A_READ:-50} CREATE_RATE=${EXP4A_CREATE:-10} UPDATE_RATE=${EXP4A_UPDATE:-10} "$RUN" experimentos/exp4a-lectura-escritura.js mixto
}

exp4b() {
  mkdir -p "$PERF/resultados/exp4b-volumen-datos"
  for n in ${EXP4B_VOLUMES:-1000 10000 100000 1000000}; do
    "$PERF/datos/indices.sh" quitar >/dev/null
    "$PERF/datos/cargar-volumen.sh" "$n"
    warmup
    for idx in no si; do
      [[ "$idx" == si ]] && "$PERF/datos/indices.sh" crear >/dev/null
      "$PERF/datos/psql.sh" < "$PERF/datos/consultas-agregadas.sql" \
        > "$PERF/resultados/exp4b-volumen-datos/agregadas-$n-indices-$idx.txt"
      TOTAL_INCIDENTS="$n" DATASET="$n" INDICES="$idx" \
        "$RUN" experimentos/exp4b-volumen-datos.js "n-$n-indices-$idx"
    done
  done
  "$PERF/datos/indices.sh" quitar >/dev/null
}

case "${1:-}" in
  smoke | exp1 | exp2a | exp2b | exp2c | exp3 | exp4a | exp4b) "$1" ;;
  todo) smoke; exp1; exp2a; exp2b; exp2c; exp3; exp4a; exp4b ;;
  *) sed -n '2,20p' "$0"; exit 1 ;;
esac
