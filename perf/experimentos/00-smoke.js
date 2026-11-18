// Prueba de humo: 1 VU, 10 s, una pasada por cada operación. Ejecútala antes de cualquier experimento
// para comprobar que la API, los usuarios de prueba y los datos funcionan.
import { sleep } from 'k6';
import { api, loginAll, nextStatus, ownIncident, makeSummary, thresholds, TREND_STATS } from '../lib/common.js';

const ENDPOINTS = ['listar', 'mapa', 'listar_filtrado', 'detalle', 'crear', 'cambiar_estado',
  'cambiar_prioridad', 'comentar', 'activos_cercanos', 'login'];

export const options = {
  vus: 1,
  duration: __ENV.DURATION || '10s',
  summaryTrendStats: TREND_STATS,
  thresholds: thresholds(ENDPOINTS, { http_req_failed: ['rate==0'] }),
};

export function setup() {
  return loginAll();
}

export default function (tokens) {
  api.listar(tokens.operator);
  api.mapa(tokens.operator);
  api.listarFiltrado(tokens.operator);
  api.detalle();
  api.crear(tokens.citizen);
  nextStatus(tokens);
  api.cambiarPrioridad(tokens.operator, ownIncident(tokens));
  api.comentar(tokens.operator, ownIncident(tokens));
  api.activosCercanos(tokens.operator);
  api.login();
  sleep(1);
}

export const handleSummary = makeSummary({ experimento: 'smoke' });
