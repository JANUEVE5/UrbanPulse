// Experimento 4a — Lecturas frente a escrituras concurrentes sobre PostgreSQL.
// Tres flujos independientes con tasa fija (modelo abierto); cada uno se activa si su tasa es > 0:
//   lectura      → READ_RATE   consultas/s (mapa, listado y detalle)
//   creacion     → CREATE_RATE altas/s
//   modificacion → UPDATE_RATE cambios/s (estado con su registro en StatusChange, prioridad y comentarios)
//
// Compara ejecuciones solo-lectura, solo-escritura y mixtas (experimentos.sh las lanza) para ver cuánto
// empeora cada tipo de operación cuando compite con las demás.
//
//   k6 run -e READ_RATE=50 -e CREATE_RATE=10 -e UPDATE_RATE=10 experimentos/exp4a-lectura-escritura.js
import { api, loginAll, makeSummary, nextStatus, ownIncident, thresholds, TREND_STATS } from '../lib/common.js';

const READ_RATE = Number(__ENV.READ_RATE ?? 50);
const CREATE_RATE = Number(__ENV.CREATE_RATE ?? 10);
const UPDATE_RATE = Number(__ENV.UPDATE_RATE ?? 10);
const DURATION = __ENV.DURATION || '2m';

function flow(exec, rate) {
  return {
    executor: 'constant-arrival-rate',
    exec,
    rate,
    timeUnit: '1s',
    duration: DURATION,
    // El tope evita que k6 reserve miles de VUs (y de RAM) con tasas altas
    preAllocatedVUs: Math.min(100, Math.max(5, Math.ceil(rate / 10))),
    maxVUs: Math.min(500, Math.max(20, rate * 4)),
  };
}

const scenarios = {};
const endpoints = [];
if (READ_RATE > 0) {
  scenarios.lectura = flow('leer', READ_RATE);
  endpoints.push('mapa', 'listar', 'detalle');
}
if (CREATE_RATE > 0) {
  scenarios.creacion = flow('crear', CREATE_RATE);
  endpoints.push('crear');
}
if (UPDATE_RATE > 0) {
  scenarios.modificacion = flow('modificar', UPDATE_RATE);
  endpoints.push('cambiar_estado', 'cambiar_prioridad', 'comentar');
}
if (endpoints.length === 0) {
  throw new Error('Define al menos una tasa > 0 (READ_RATE, CREATE_RATE o UPDATE_RATE).');
}

const t = thresholds(endpoints);
for (const s of Object.keys(scenarios)) {
  t[`http_req_duration{scenario:${s}}`] = [`p(95)<${__ENV.SLO_P95_MS || 500}`];
  t[`http_reqs{scenario:${s}}`] = ['count>=0'];
  t[`dropped_iterations{scenario:${s}}`] = ['count==0'];
}

export const options = { scenarios, summaryTrendStats: TREND_STATS, thresholds: t };

export function setup() {
  return loginAll();
}

export function leer(tokens) {
  const r = Math.random();
  if (r < 0.5) api.mapa(tokens.operator);
  else if (r < 0.8) api.listar(tokens.operator);
  else api.detalle();
}

export function crear(tokens) {
  api.crear(tokens.citizen);
}

export function modificar(tokens) {
  const r = Math.random();
  if (r < 0.5) nextStatus(tokens);
  else if (r < 0.75) api.cambiarPrioridad(tokens.operator, ownIncident(tokens));
  else api.comentar(tokens.operator, ownIncident(tokens));
}

export const handleSummary = makeSummary({
  experimento: 'exp4a',
  read_rate: READ_RATE,
  create_rate: CREATE_RATE,
  update_rate: UPDATE_RATE,
  duration: DURATION,
});
