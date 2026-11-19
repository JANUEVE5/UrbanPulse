// Experimento 1 — Caracterización del rendimiento (línea base): ¿qué operaciones son más lentas?
// Una operación por ejecución (OP), carga pequeña y estable: VUS (10) usuarios durante DURATION (2m).
// run.sh / experimentos.sh lanzan todas las operaciones, cada una al menos 3 veces.
//
//   k6 run -e OP=listar experimentos/exp1-linea-base.js
//
// OP: listar | mapa | listar_filtrado | detalle | crear | cambiar_estado | cambiar_prioridad |
//     comentar | activos_cercanos | login
import { sleep } from 'k6';
import { api, loginAll, nextStatus, ownIncident, makeSummary, thresholds, TREND_STATS, THINK_TIME } from '../lib/common.js';

const OP = __ENV.OP || 'listar';
const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || '2m';

const OPERATIONS = {
  listar: (t) => api.listar(t.operator),
  mapa: (t) => api.mapa(t.operator),
  listar_filtrado: (t) => api.listarFiltrado(t.operator),
  detalle: () => api.detalle(),
  crear: (t) => api.crear(t.citizen),
  cambiar_estado: (t) => nextStatus(t),
  cambiar_prioridad: (t) => api.cambiarPrioridad(t.operator, ownIncident(t)),
  comentar: (t) => api.comentar(t.operator, ownIncident(t)),
  activos_cercanos: (t) => api.activosCercanos(t.operator),
  login: () => api.login(),
};

if (!OPERATIONS[OP]) {
  throw new Error(`OP desconocida: ${OP}. Valores: ${Object.keys(OPERATIONS).join(', ')}`);
}

export const options = {
  scenarios: {
    [OP]: { executor: 'constant-vus', vus: VUS, duration: DURATION },
  },
  summaryTrendStats: TREND_STATS,
  thresholds: thresholds([OP]),
};

export function setup() {
  return loginAll();
}

export default function (tokens) {
  OPERATIONS[OP](tokens);
  if (THINK_TIME > 0) sleep(THINK_TIME);
}

export const handleSummary = makeSummary({ experimento: 'exp1', op: OP, vus: VUS, duration: DURATION });
