// Carga de trabajo para los experimentos de capacidad (exp2): una operación concreta (OP) o una mezcla
// realista ("mixto"), pensada como el uso típico de la app: sobre todo consultas, algunas altas y cambios.
import { api, nextStatus, ownIncident } from './common.js';

const MIX = [
  // [peso, endpoint, función]
  [35, 'mapa', (t) => api.mapa(t.operator)],
  [20, 'listar', (t) => api.listar(t.operator)],
  [20, 'detalle', () => api.detalle()],
  [15, 'crear', (t) => api.crear(t.citizen)],
  [5, 'cambiar_estado', (t) => nextStatus(t)],
  [5, 'cambiar_prioridad', (t) => api.cambiarPrioridad(t.operator, ownIncident(t))],
];
const TOTAL = MIX.reduce((s, [w]) => s + w, 0);

const SINGLE = {
  listar: (t) => api.listar(t.operator),
  mapa: (t) => api.mapa(t.operator),
  listar_filtrado: (t) => api.listarFiltrado(t.operator),
  detalle: () => api.detalle(),
  crear: (t) => api.crear(t.citizen),
  cambiar_estado: (t) => nextStatus(t),
};

export const OP = __ENV.OP || 'mixto';

if (OP !== 'mixto' && !SINGLE[OP]) {
  throw new Error(`OP desconocida: ${OP}. Valores: mixto, ${Object.keys(SINGLE).join(', ')}`);
}

/** Endpoints que aparecerán en el resumen (para los umbrales por etiqueta). */
export const WORKLOAD_ENDPOINTS = OP === 'mixto' ? MIX.map(([, e]) => e) : [OP];

export function runWorkload(tokens) {
  if (OP !== 'mixto') {
    SINGLE[OP](tokens);
    return;
  }
  let r = Math.random() * TOTAL;
  for (const [w, , fn] of MIX) {
    r -= w;
    if (r <= 0) {
      fn(tokens);
      return;
    }
  }
}
