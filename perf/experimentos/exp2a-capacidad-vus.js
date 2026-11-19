// Experimento 2a — Capacidad con número fijo de usuarios (modelo cerrado).
// Una ejecución por nivel de concurrencia: VUS = 10, 25, 50, 100… (experimentos.sh los recorre).
// Busca el nivel en el que la latencia se dispara, aparecen errores o el throughput deja de crecer.
//
//   k6 run -e VUS=50 -e OP=mixto experimentos/exp2a-capacidad-vus.js
import { sleep } from 'k6';
import { loginAll, makeSummary, thresholds, TREND_STATS, THINK_TIME } from '../lib/common.js';
import { OP, WORKLOAD_ENDPOINTS, runWorkload } from '../lib/workload.js';

const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || '2m';

export const options = {
  scenarios: {
    capacidad_vus: { executor: 'constant-vus', vus: VUS, duration: DURATION },
  },
  summaryTrendStats: TREND_STATS,
  thresholds: thresholds(WORKLOAD_ENDPOINTS, {
    http_req_duration: [`p(95)<${__ENV.SLO_P95_MS || 500}`],
    http_req_failed: ['rate<0.01'],
  }),
};

export function setup() {
  return loginAll();
}

export default function (tokens) {
  runWorkload(tokens);
  if (THINK_TIME > 0) sleep(THINK_TIME);
}

export const handleSummary = makeSummary({ experimento: 'exp2a', op: OP, vus: VUS, duration: DURATION });
