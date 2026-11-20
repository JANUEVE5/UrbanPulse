// Experimento 2c — Rampa de tasa con ramping-arrival-rate: sube la tasa por escalones hasta encontrar
// el punto de saturación (latencia por encima del SLO, errores o dropped_iterations).
// Mejor verlo en Grafana (latencia y throughput frente al tiempo) que solo en el resumen.
//
//   k6 run -e RATES=20,50,100,150,200 -e STEP=1m experimentos/exp2c-tasa-creciente.js
import { loginAll, makeSummary, thresholds, TREND_STATS } from '../lib/common.js';
import { OP, WORKLOAD_ENDPOINTS, runWorkload } from '../lib/workload.js';

const RATES = (__ENV.RATES || '20,50,100,150,200,300').split(',').map(Number);
const STEP = __ENV.STEP || '1m';
const RAMP = __ENV.RAMP || '20s';
const MAX_VUS = Number(__ENV.MAX_VUS || Math.min(500, Math.max(...RATES) * 2));

const stages = [];
for (const rate of RATES) {
  stages.push({ duration: RAMP, target: rate }); // rampa hasta el escalón
  stages.push({ duration: STEP, target: rate }); // mantener el escalón
}
stages.push({ duration: RAMP, target: 0 });

export const options = {
  scenarios: {
    tasa_creciente: {
      executor: 'ramping-arrival-rate',
      startRate: RATES[0],
      timeUnit: '1s',
      preAllocatedVUs: Number(__ENV.PRE_VUS || 20),
      maxVUs: MAX_VUS,
      stages,
    },
  },
  summaryTrendStats: TREND_STATS,
  // Es una prueba de estrés: se espera que algún umbral falle a partir de cierto escalón.
  thresholds: thresholds(WORKLOAD_ENDPOINTS, { dropped_iterations: ['count==0'] }),
};

export function setup() {
  return loginAll();
}

export default function (tokens) {
  runWorkload(tokens);
}

export const handleSummary = makeSummary({ experimento: 'exp2c', op: OP, rates: RATES, step: STEP });
