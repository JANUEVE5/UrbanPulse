#!/usr/bin/env bash
# Ejecuta un script k6 REPS veces (3 por defecto) y guarda cada repetición en
#   perf/resultados/<experimento>/<etiqueta>/rep-<n>/{summary.json, report.html, k6.log}
#
#   ./perf/run.sh experimentos/exp1-linea-base.js op-listar        # con OP=listar en el entorno
#   VUS=50 OP=mixto ./perf/run.sh experimentos/exp2a-capacidad-vus.js vus-50
#
# Variables: REPS (3), COOLDOWN segundos entre repeticiones (30), RESET_DB=si para borrar antes de cada
# repetición las incidencias creadas por k6 (datos/reiniciar.sql), PROMETHEUS=auto|si|no (auto: envía
# las métricas a Prometheus si responde en PROMETHEUS_URL), K6 (binario de k6) y cualquier variable
# que lea el script (k6 pasa el entorno a __ENV).
set -euo pipefail
PERF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="${1:?Uso: run.sh <script.js> [etiqueta]}"
LABEL="${2:-default}"
REPS="${REPS:-3}"
COOLDOWN="${COOLDOWN:-30}"
K6="${K6:-k6}"
PROMETHEUS="${PROMETHEUS:-auto}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"

[[ -f "$SCRIPT" ]] || SCRIPT="$PERF/$SCRIPT"
[[ -f "$SCRIPT" ]] || { echo "No existe el script $1" >&2; exit 1; }
command -v "$K6" >/dev/null || { echo "No encuentro k6 ($K6). Instálalo: https://grafana.com/docs/k6/latest/set-up/install-k6/" >&2; exit 1; }

EXP="$(basename "$SCRIPT" .js)"
OUT_BASE="$PERF/resultados/$EXP/$LABEL"

OUTPUT_ARGS=()
if [[ "$PROMETHEUS" == "si" ]] || { [[ "$PROMETHEUS" == "auto" ]] && curl -fs "$PROMETHEUS_URL/-/ready" >/dev/null 2>&1; }; then
  export K6_PROMETHEUS_RW_SERVER_URL="${K6_PROMETHEUS_RW_SERVER_URL:-$PROMETHEUS_URL/api/v1/write}"
  export K6_PROMETHEUS_RW_TREND_STATS="${K6_PROMETHEUS_RW_TREND_STATS:-p(50),p(95),p(99),avg,max}"
  OUTPUT_ARGS=(-o experimental-prometheus-rw)
  echo "» Métricas de k6 → Prometheus ($PROMETHEUS_URL)"
fi

for ((i = 1; i <= REPS; i++)); do
  OUT="$OUT_BASE/rep-$i"
  mkdir -p "$OUT"
  TESTID="$EXP-$LABEL-rep$i-$(date +%Y%m%d-%H%M%S)"
  if [[ "${RESET_DB:-no}" == "si" ]]; then
    echo "» Reiniciando los datos (borra las incidencias creadas por k6)…"
    "$PERF/datos/psql.sh" -q < "$PERF/datos/reiniciar.sql" >/dev/null
  fi
  echo "════ $EXP [$LABEL] repetición $i/$REPS → $OUT (testid=$TESTID)"
  set +e
  SUMMARY_FILE="$OUT/summary.json" LABEL="$LABEL" \
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=false K6_WEB_DASHBOARD_EXPORT="$OUT/report.html" \
    "$K6" run --tag testid="$TESTID" --tag label="$LABEL" "${OUTPUT_ARGS[@]}" "$SCRIPT" 2>&1 | tee "$OUT/k6.log"
  CODE=${PIPESTATUS[0]}
  set -e
  echo "$CODE" > "$OUT/exit-code"
  # 99 = algún umbral incumplido: es un resultado del experimento, no un fallo de la ejecución
  if [[ "$CODE" != 0 && "$CODE" != 99 ]]; then
    echo "k6 terminó con código $CODE (revisa $OUT/k6.log)" >&2
    exit "$CODE"
  fi
  [[ "$CODE" == 99 ]] && echo "⚠  Umbrales incumplidos en la repetición $i (se anota y se sigue)"
  if (( i < REPS )); then
    echo "… enfriamiento de ${COOLDOWN}s"
    sleep "$COOLDOWN"
  fi
done
