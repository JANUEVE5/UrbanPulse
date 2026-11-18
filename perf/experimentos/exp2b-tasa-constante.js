// Experimento 2b — Capacidad en peticiones/s con constant-arrival-rate (modelo abierto).
// k6 intenta INICIAR RATE iteraciones por segundo sin importar lo que tarde la API.
// Si los VUs no dan abasto, las iteraciones que no pueden empezar cuentan como dropped_iterations:
// es la señal de que la API ya no sostiene esa tasa (o de que maxVUs es demasiado bajo).
//
//   k6 run -e RATE=100 experimentos/exp2b-tasa-constante.js
import { loginAll, makeSummary, thresholds, TREND_STATS } from '../lib/common.js';
import { OP, WORKLOAD_ENDPOINTS, runWorkload } from '../lib/workload.js';

const RATE = Number(__ENV.RATE || 50);
const DURATION = __ENV.DURATION || '2m';
const MAX_VUS = Number(__ENV.MAX_VUS || Math.max(100, RATE * 2));

export const options = {
  scenarios: {
    tasa_constante: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Number(__ENV.PRE_VUS || Math.min(MAX_VUS, Math.max(10, Math.ceil(RATE / 2)))),
      maxVUs: MAX_VUS,
    },
  },
  summaryTrendStats: TREND_STATS,
  thresholds: thresholds(WORKLOAD_ENDPOINTS, {
    http_req_duration: [`p(95)<${__ENV.SLO_P95_MS || 500}`],
    http_req_failed: ['rate<0.01'],
    dropped_iterations: ['count==0'],
  }),
};

export function setup() {
  return loginAll();
}

export default function (tokens) {
  runWorkload(tokens);
}

export const handleSummary = makeSummary({ experimento: 'exp2b', op: OP, rate: RATE, duration: DURATION });
