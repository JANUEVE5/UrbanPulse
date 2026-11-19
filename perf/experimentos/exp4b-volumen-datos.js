// Experimento 4b — Influencia del volumen de datos (1.000, 10.000, 100.000, 1.000.000 incidencias).
// Antes de cada ejecución, carga el volumen con datos/cargar-volumen.sh N (y opcionalmente los índices
// con datos/indices.sh crear). Cada consulta se mide por separado con VUS usuarios durante DURATION.
//
// Consultas:
//   pagina_inicial     → primera página ordenada por fecha (lo que ve un operador al entrar)
//   pagina_profunda    → página cercana al final (OFFSET grande)
//   orden_fecha_asc    → ordenación inversa por fecha
//   filtro_estado      → incidencias "Abierta" (findByEstadoIn)
//   filtro_combinado   → estado + prioridad + categoría (Specification con lower(...))
//   propias_ciudadano  → listado de un ciudadano (findByCreadorId)
//   detalle            → detalle con historial (StatusChange) y comentarios de una incidencia al azar
// Todas las consultas paginadas ejecutan además un COUNT(*) para totalElements: es la parte
// "agregada" de cada listado. Las estadísticas agregadas puras se miden en SQL (datos/consultas-agregadas.sql)
// porque la API aún no tiene endpoint de estadísticas (RF15).
//
//   k6 run -e TOTAL_INCIDENTS=100000 -e DATASET=100k -e INDICES=no experimentos/exp4b-volumen-datos.js
import { sleep } from 'k6';
import { api, loginAll, makeSummary, pick, thresholds, PRIORITIES, CATEGORIES, TREND_STATS, THINK_TIME } from '../lib/common.js';

const TOTAL = Number(__ENV.TOTAL_INCIDENTS || 1000);
const VUS = Number(__ENV.VUS || 10);
const DURATION = __ENV.DURATION || '1m';
const PAUSE = Number(__ENV.PAUSE_SECONDS || 10);
const SIZE = 20;
const DEEP_PAGE = Math.max(0, Math.floor((TOTAL * 0.9) / SIZE));

const QUERIES = {
  pagina_inicial: (t) => api.listar(t.operator, `page=0&size=${SIZE}&sort=createdAt,desc`, 'pagina_inicial'),
  pagina_profunda: (t) => api.listar(t.operator, `page=${DEEP_PAGE}&size=${SIZE}&sort=createdAt,desc`, 'pagina_profunda'),
  orden_fecha_asc: (t) => api.listar(t.operator, `page=0&size=${SIZE}&sort=createdAt,asc`, 'orden_fecha_asc'),
  filtro_estado: (t) => api.listar(t.operator, `estado=Abierta&page=0&size=${SIZE}`, 'filtro_estado'),
  filtro_combinado: (t) => api.listar(
    t.operator,
    `estado=activas&prioridad=${pick(PRIORITIES)}&categoria=${encodeURIComponent(pick(CATEGORIES))}&size=${SIZE}`,
    'filtro_combinado',
  ),
  propias_ciudadano: (t) => api.listar(t.citizen, `page=0&size=${SIZE}`, 'propias_ciudadano'),
  detalle: () => api.detalle(1 + Math.floor(Math.random() * TOTAL)),
};

const selected = (__ENV.QUERIES ? __ENV.QUERIES.split(',') : Object.keys(QUERIES));
function seconds(d) {
  const m = /^(\d+)(s|m)$/.exec(d);
  if (!m) throw new Error(`Duración no válida: ${d} (usa p. ej. 30s o 2m)`);
  return Number(m[1]) * (m[2] === 'm' ? 60 : 1);
}
const step = seconds(DURATION) + PAUSE;

// Una consulta detrás de otra (startTime escalonado) para medir cada una sin interferencias.
const scenarios = {};
selected.forEach((q, i) => {
  if (!QUERIES[q]) throw new Error(`Consulta desconocida: ${q}`);
  scenarios[q] = {
    executor: 'constant-vus',
    exec: 'consulta',
    vus: VUS,
    duration: DURATION,
    startTime: `${i * step}s`,
    env: { QUERY: q },
  };
});

export const options = {
  scenarios,
  summaryTrendStats: TREND_STATS,
  thresholds: thresholds(selected),
  setupTimeout: '2m',
};

export function setup() {
  return loginAll();
}

export function consulta(tokens) {
  QUERIES[__ENV.QUERY](tokens);
  if (THINK_TIME > 0) sleep(THINK_TIME);
}

const durations = {};
for (const q of selected) durations[q] = seconds(DURATION);

export const handleSummary = makeSummary({
  experimento: 'exp4b',
  total_incidents: TOTAL,
  dataset: __ENV.DATASET || String(TOTAL),
  indices: __ENV.INDICES || 'no',
  durations,
});
