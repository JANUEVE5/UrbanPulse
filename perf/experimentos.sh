#!/usr/bin/env bash
# Lanza la batería de un experimento: todas sus configuraciones × REPS repeticiones (3).
#
#   ./perf/experimentos.sh smoke | exp1 | exp2 | exp3 | exp4 | todo
#   (también por partes: exp2a | exp2b | exp2c | exp4a | exp4b)
#
# MODO=rapido (por defecto, ~1 h en total) da lo necesario para rellenar el enunciado:
#   exp1 ~10 min · exp2 ~17 min · exp3 ~12 min · exp4 ~30 min
# MODO=completo usa duraciones largas, más operaciones, más niveles y 1.000.000 de incidencias (~7 h).
#
# Requisitos: backend en BASE_URL (http://localhost:8080) y acceso a la base de datos con perf/datos/psql.sh
# (contenedor de compose.yaml o, con PostgreSQL local, export PSQL="psql -h localhost -U postgres -d urbanpulse"
# y PGPASSWORD). Antes de cada repetición se borran las incidencias creadas por k6 (RESET_DB=si), así
# no hace falta reiniciar la API entre experimentos; sí al terminar el exp4b, que sustituye los datos.
#
# Las cargas del modo rápido están calibradas para un portátil de 16 hilos con k6 y la API en la misma
# máquina (capacidad de la carga mixta ≈ 2.500 peticiones/s). En un equipo más lento, bájalas
# (p. ej. EXP2_RATES="250 500 1000").
#
# Cualquier valor se puede sobrescribir con variables de entorno: REPS, COOLDOWN, WARMUP, EXP1_OPS,
# EXP1_DURATION, EXP2_VUS, EXP2_RATES, EXP2_DURATION, EXP2_OP, EXP2C_RATES, EXP2C_STEP, EXP3_MAP_VUS,
# EXP3_BASE_RATE, EXP3_PEAK_RATE, EXP4A_READ, EXP4A_CREATE, EXP4A_UPDATE, EXP4A_DURATION, EXP4B_VOLUMES,
# EXP4B_QUERIES, EXP4B_DURATION.
set -euo pipefail
PERF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN="$PERF/run.sh"
MODO="${MODO:-rapido}"

if [[ "$MODO" == "completo" ]]; then
  : "${COOLDOWN:=30}" "${WARMUP:=30s}"
  : "${EXP1_OPS:=listar mapa listar_filtrado detalle crear cambiar_estado cambiar_prioridad comentar activos_cercanos login}"
  : "${EXP1_DURATION:=2m}"
  : "${EXP2_VUS:=10 25 50 100 200 400}" "${EXP2_RATES:=500 1000 1500 2000 2500 3000}" "${EXP2_DURATION:=2m}"
  : "${EXP2C_RATES:=500,1000,1500,2000,2500,3000,3500,4000}" "${EXP2C_STEP:=1m}" "${EXP2C_RAMP:=20s}" "${EXP2C_REPS:=3}"
  : "${EXP3_MAP_VUS:=0 100 200}" "${EXP3_BASE:=1m}" "${EXP3_PEAK:=1m}" "${EXP3_RECOVERY:=2m}"
  : "${EXP3_BASE_RATE:=100}" "${EXP3_PEAK_RATE:=5000}"
  : "${EXP4A_DURATION:=2m}" "${EXP4A_READ:=1000}" "${EXP4A_CREATE:=1000}" "${EXP4A_UPDATE:=1000}"
  : "${EXP4B_VOLUMES:=1000 10000 100000 1000000}"
  : "${EXP4B_QUERIES:=pagina_inicial,pagina_profunda,orden_fecha_asc,filtro_estado,filtro_combinado,propias_ciudadano,detalle}"
  : "${EXP4B_DURATION:=1m}" "${EXP4B_PAUSE:=10}"
else
  : "${COOLDOWN:=10}" "${WARMUP:=15s}"
  : "${EXP1_OPS:=listar detalle crear cambiar_estado login}"
  : "${EXP1_DURATION:=30s}"
  : "${EXP2_VUS:=10 50 100 200}" "${EXP2_RATES:=1000 2000 3000}" "${EXP2_DURATION:=30s}"
  : "${EXP2C_RATES:=500,1000,1500,2000,2500,3000,3500}" "${EXP2C_STEP:=20s}" "${EXP2C_RAMP:=10s}" "${EXP2C_REPS:=1}"
  : "${EXP3_MAP_VUS:=0 200}" "${EXP3_BASE:=30s}" "${EXP3_PEAK:=30s}" "${EXP3_RECOVERY:=1m}"
  : "${EXP3_BASE_RATE:=100}" "${EXP3_PEAK_RATE:=5000}"
  : "${EXP4A_DURATION:=30s}" "${EXP4A_READ:=1000}" "${EXP4A_CREATE:=1000}" "${EXP4A_UPDATE:=1000}"
  : "${EXP4B_VOLUMES:=1000 10000 100000}"
  : "${EXP4B_QUERIES:=pagina_inicial,pagina_profunda,filtro_estado,filtro_combinado}"
  : "${EXP4B_DURATION:=15s}" "${EXP4B_PAUSE:=3}"
fi
export COOLDOWN
export RESET_DB="${RESET_DB:-si}"

check_db() {
  "$PERF/datos/psql.sh" -qtAc "SELECT 1" >/dev/null 2>&1 || {
    echo "No puedo conectar con PostgreSQL desde perf/datos/psql.sh." >&2
    echo "Con PostgreSQL local: export PSQL=\"psql -h localhost -U postgres -d urbanpulse\" PGPASSWORD=<contraseña>" >&2
    echo "(o lanza con RESET_DB=no para no reiniciar los datos entre repeticiones; exp4b lo necesita siempre)" >&2
    exit 1; }
}

warmup() {
  [[ "$WARMUP" == "0" ]] && return
  echo "» Calentamiento ($WARMUP) para estabilizar JVM y cachés…"
  DURATION="$WARMUP" "${K6:-k6}" run --quiet "$PERF/experimentos/00-smoke.js" >/dev/null 2>&1 || {
    echo "La prueba de humo falla: ejecuta ./perf/experimentos.sh smoke para ver el motivo." >&2; exit 1; }
}

smoke() { REPS=1 "$RUN" experimentos/00-smoke.js smoke; }

exp1() {
  warmup
  for op in $EXP1_OPS; do
    OP="$op" DURATION="$EXP1_DURATION" "$RUN" experimentos/exp1-linea-base.js "op-$op"
  done
}

exp2a() {
  warmup
  for vus in $EXP2_VUS; do
    VUS="$vus" OP="${EXP2_OP:-mixto}" DURATION="$EXP2_DURATION" "$RUN" experimentos/exp2a-capacidad-vus.js "vus-$vus"
  done
}

exp2b() {
  warmup
  for rate in $EXP2_RATES; do
    RATE="$rate" OP="${EXP2_OP:-mixto}" DURATION="$EXP2_DURATION" "$RUN" experimentos/exp2b-tasa-constante.js "rate-$rate"
  done
}

exp2c() {
  warmup
  REPS="$EXP2C_REPS" RATES="$EXP2C_RATES" STEP="$EXP2C_STEP" RAMP="$EXP2C_RAMP" OP="${EXP2_OP:-mixto}" \
    "$RUN" experimentos/exp2c-tasa-creciente.js "rampa"
}

exp3() {
  warmup
  for map in $EXP3_MAP_VUS; do
    MAP_VUS="$map" MAP_THINK="${EXP3_MAP_THINK:-0}" BASE_RATE="$EXP3_BASE_RATE" PEAK_RATE="$EXP3_PEAK_RATE" BASE_DURATION="$EXP3_BASE" PEAK_DURATION="$EXP3_PEAK" RECOVERY_DURATION="$EXP3_RECOVERY" \
      "$RUN" experimentos/exp3-pico-emergencia.js "mapa-$map"
  done
}

exp4a() {
  warmup
  local d="$EXP4A_DURATION"
  DURATION="$d" READ_RATE=$EXP4A_READ CREATE_RATE=0 UPDATE_RATE=0 \
    "$RUN" experimentos/exp4a-lectura-escritura.js solo-lectura
  DURATION="$d" READ_RATE=0 CREATE_RATE=$EXP4A_CREATE UPDATE_RATE=$EXP4A_UPDATE \
    "$RUN" experimentos/exp4a-lectura-escritura.js solo-escritura
  DURATION="$d" READ_RATE=$EXP4A_READ CREATE_RATE=$EXP4A_CREATE UPDATE_RATE=$EXP4A_UPDATE \
    "$RUN" experimentos/exp4a-lectura-escritura.js mixto
}

exp4b() {
  mkdir -p "$PERF/resultados/exp4b-volumen-datos"
  for n in $EXP4B_VOLUMES; do
    "$PERF/datos/indices.sh" quitar >/dev/null
    "$PERF/datos/cargar-volumen.sh" "$n"
    warmup
    for idx in no si; do
      [[ "$idx" == si ]] && "$PERF/datos/indices.sh" crear >/dev/null
      "$PERF/datos/psql.sh" < "$PERF/datos/consultas-agregadas.sql" \
        > "$PERF/resultados/exp4b-volumen-datos/agregadas-$n-indices-$idx.txt"
      RESET_DB=no TOTAL_INCIDENTS="$n" DATASET="$n" INDICES="$idx" QUERIES="$EXP4B_QUERIES" \
        DURATION="$EXP4B_DURATION" PAUSE_SECONDS="$EXP4B_PAUSE" \
        "$RUN" experimentos/exp4b-volumen-datos.js "n-$n-indices-$idx"
    done
  done
  "$PERF/datos/indices.sh" quitar >/dev/null
}

exp2() { exp2a; exp2b; exp2c; }
exp4() { exp4a; exp4b; }

echo "» MODO=$MODO"
[[ "$RESET_DB" == "si" || "${1:-}" == exp4* || "${1:-}" == todo ]] && [[ "${1:-}" != smoke ]] && check_db
case "${1:-}" in
  smoke | exp1 | exp2 | exp2a | exp2b | exp2c | exp3 | exp4 | exp4a | exp4b) "$1" ;;
  todo) smoke; exp1; exp2; exp3; exp4 ;;
  *) sed -n '2,18p' "$0"; exit 1 ;;
esac
