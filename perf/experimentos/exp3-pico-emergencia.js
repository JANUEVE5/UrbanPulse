// Experimento 3 — Pico de incidencias por un episodio de lluvias intensas en Málaga.
//
// Fases de creación de incidencias (escenarios consecutivos con tasa fija, modelo abierto):
//   base         → BASE_RATE altas/s durante BASE_DURATION   (día normal)
//   pico         → PEAK_RATE altas/s durante PEAK_DURATION   (tromba de agua: alcantarillas, inundaciones, tráfico)
//   recuperacion → BASE_RATE altas/s durante RECOVERY_DURATION (¿vuelve la latencia a la de la fase base?)
//
// En paralelo, MAP_VUS usuarios consultan el mapa de incidencias durante toda la prueba.
// Para responder a la pregunta arquitectónica, ejecuta con MAP_VUS=0 y con MAP_VUS=50/100 y compara
// la latencia de "crear" en la fase pico (competencia por hilos, pool de conexiones y PostgreSQL).
//
//   k6 run -e MAP_VUS=50 -e PEAK_RATE=40 experimentos/exp3-pico-emergencia.js
import { sleep } from 'k6';
import { api, loginAll, makeSummary, newIncident, pick, thresholds, TREND_STATS } from '../lib/common.js';

const BASE_RATE = Number(__ENV.BASE_RATE || 2);
const PEAK_RATE = Number(__ENV.PEAK_RATE || 40);
const MAP_VUS = Number(__ENV.MAP_VUS || 50);
const MAP_THINK = Number(__ENV.MAP_THINK || 1); // s entre consultas de un mismo usuario del mapa

const BASE_DURATION = __ENV.BASE_DURATION || '1m';
const PEAK_DURATION = __ENV.PEAK_DURATION || '1m';
const RECOVERY_DURATION = __ENV.RECOVERY_DURATION || '2m';

function seconds(d) {
  const m = /^(\d+)(s|m)$/.exec(d);
  if (!m) throw new Error(`Duración no válida: ${d} (usa p. ej. 30s o 2m)`);
  return Number(m[1]) * (m[2] === 'm' ? 60 : 1);
}

const tBase = seconds(BASE_DURATION);
const tPeak = seconds(PEAK_DURATION);
const tRecovery = seconds(RECOVERY_DURATION);
const total = tBase + tPeak + tRecovery;

function phase(rate, duration, startTime) {
  return {
    executor: 'constant-arrival-rate',
    exec: 'reportar',
    rate,
    timeUnit: '1s',
    duration,
    startTime,
    // El tope evita que k6 reserve miles de VUs (y de RAM) con tasas altas
    preAllocatedVUs: Math.min(100, Math.max(5, Math.ceil(rate / 10))),
    maxVUs: Math.min(500, Math.max(20, rate * 4)),
  };
}

const scenarios = {
  base: phase(BASE_RATE, BASE_DURATION, '0s'),
  pico: phase(PEAK_RATE, PEAK_DURATION, `${tBase}s`),
  recuperacion: phase(BASE_RATE, RECOVERY_DURATION, `${tBase + tPeak}s`),
};
if (MAP_VUS > 0) {
  scenarios.consultas_mapa = { executor: 'constant-vus', exec: 'consultarMapa', vus: MAP_VUS, duration: `${total}s` };
}

const t = thresholds(['crear', 'mapa']);
for (const s of ['base', 'pico', 'recuperacion']) {
  t[`http_req_duration{scenario:${s}}`] = [`p(95)<${__ENV.SLO_P95_MS || 500}`];
  t[`http_req_failed{scenario:${s}}`] = ['rate<0.01'];
  t[`http_reqs{scenario:${s}}`] = ['count>=0'];
  t[`dropped_iterations{scenario:${s}}`] = ['count==0'];
}
if (MAP_VUS > 0) {
  t['http_req_duration{scenario:consultas_mapa}'] = [`p(95)<${__ENV.SLO_P95_MS || 500}`];
  t['http_reqs{scenario:consultas_mapa}'] = ['count>=0'];
}

export const options = { scenarios, summaryTrendStats: TREND_STATS, thresholds: t };

// Avisos típicos de un episodio de lluvias intensas
const AVISOS = [
  { titulo: 'Alcantarilla obstruida', categoria: 'Limpieza', descripcion: 'El imbornal está atascado y el agua no desagua.' },
  { titulo: 'Calle inundada', categoria: 'Limpieza', descripcion: 'Acumulación de agua que impide el paso de peatones.' },
  { titulo: 'Semáforo apagado por la lluvia', categoria: 'Tráfico', descripcion: 'El semáforo no funciona y hay retenciones.' },
  { titulo: 'Árbol caído en la calzada', categoria: 'Zonas verdes', descripcion: 'Rama de gran tamaño bloquea un carril.' },
  { titulo: 'Farola sin luz tras la tormenta', categoria: 'Alumbrado', descripcion: 'Tramo de calle completamente a oscuras.' },
];

export function setup() {
  return loginAll();
}

export function reportar(tokens) {
  const aviso = pick(AVISOS);
  api.crear(tokens.citizen, newIncident({ ...aviso, titulo: `${aviso.titulo} VU-${__VU}-${__ITER}`, prioridad: 'Alta' }));
}

export function consultarMapa(tokens) {
  api.mapa(tokens.operator);
  sleep(MAP_THINK);
}

export const handleSummary = makeSummary({
  experimento: 'exp3',
  map_vus: MAP_VUS,
  base_rate: BASE_RATE,
  peak_rate: PEAK_RATE,
  durations: { base: tBase, pico: tPeak, recuperacion: tRecovery, consultas_mapa: total },
});
