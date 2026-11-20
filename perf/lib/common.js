// Utilidades compartidas por todos los experimentos k6 de UrbanPulse.
// Toda la configuración se puede cambiar con variables de entorno (k6 run -e VAR=valor o export VAR=valor).
import http from 'k6/http';
import { check, fail } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

export const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

// Usuarios de prueba de data.sql (solo desarrollo). La contraseña por defecto es la de los datos
// de ejemplo del proyecto; en otro entorno se pasa con -e USER_PASSWORD=...
const PASSWORD = __ENV.USER_PASSWORD || 'urbanpulse-dev';
export const USERS = {
  operator: __ENV.OPERATOR_EMAIL || 'lucia.navarro@urbanpulse.es',
  citizen: __ENV.CITIZEN_EMAIL || 'david.serrano@urbanpulse.es',
};

// Requisito de calidad de referencia (tutorial): p95 < 500 ms y < 1 % de errores.
export const SLO_P95_MS = Number(__ENV.SLO_P95_MS || 500);
export const SLO_ERROR_RATE = Number(__ENV.SLO_ERROR_RATE || 0.01);

// Pausa entre iteraciones (s). 0 = carga "cerrada" sin tiempo de reflexión.
export const THINK_TIME = Number(__ENV.THINK_TIME || 0);

// Rango de ids de incidencias existentes para el detalle (data.sql trae 20).
export const MAX_INCIDENT_ID = Number(__ENV.MAX_INCIDENT_ID || 20);

export const TREND_STATS = ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max', 'count'];

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ---------------------------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------------------------

export function login(correo, tags = { endpoint: 'login' }) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ correo, password: PASSWORD }),
    { headers: JSON_HEADERS, tags },
  );
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) {
    return null;
  }
  return res.json('token');
}

/** Se llama desde setup(): un token por rol, compartido por todos los VUs (caduca en JWT_EXPIRATION_MINUTES). */
export function loginAll() {
  const health = http.get(`${BASE_URL}/actuator/health`, { tags: { endpoint: 'setup' } });
  if (health.status !== 200) {
    fail(`La API no responde en ${BASE_URL}/actuator/health (estado ${health.status}). ¿Está arrancado el backend?`);
  }
  const operator = login(USERS.operator, { endpoint: 'setup' });
  const citizen = login(USERS.citizen, { endpoint: 'setup' });
  if (!operator || !citizen) {
    fail('No se pudo iniciar sesión con los usuarios de prueba. Revisa USER_PASSWORD / *_EMAIL.');
  }
  return { operator, citizen };
}

function auth(token, endpoint) {
  return {
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
    tags: { endpoint },
  };
}

// ---------------------------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------------------------

export const CATEGORIES = ['Alumbrado', 'Limpieza', 'Mobiliario', 'Tráfico', 'Zonas verdes'];
export const PRIORITIES = ['Baja', 'Media', 'Alta'];

// Recuadro aproximado del término municipal de Málaga
const LAT = [36.68, 36.76];
const LON = [-4.52, -4.36];

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function between([min, max]) {
  return Number((min + Math.random() * (max - min)).toFixed(6));
}

export function randomPoint() {
  return { latitud: between(LAT), longitud: between(LON) };
}

/** Incidencia distinta en cada iteración (__VU / __ITER) para no chocar con reglas de negocio. */
export function newIncident(overrides = {}) {
  return {
    titulo: `Incidencia k6 VU-${__VU}-${__ITER}`,
    descripcion: 'Incidencia generada por una prueba de carga con k6.',
    categoria: pick(CATEGORIES),
    prioridad: pick(PRIORITIES),
    localizacion: 'Málaga (k6)', // marca para borrarlas entre repeticiones (datos/reiniciar.sql)
    ...randomPoint(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------------------------
// Operaciones de la API. Cada petición lleva la etiqueta "endpoint" para separar sus métricas.
// ---------------------------------------------------------------------------------------------

function expect(res, status, endpoint) {
  check(res, { [`${endpoint} ${status}`]: (r) => r.status === status });
  return res;
}

export const api = {
  /** Listado paginado (operador: ve todas). */
  listar(token, query = 'page=0&size=20', endpoint = 'listar') {
    return expect(http.get(`${BASE_URL}/api/incidents?${query}`, auth(token, endpoint)), 200, endpoint);
  },

  /** Lo que pide la pantalla de mapa: incidencias activas, hasta 100. */
  mapa(token, endpoint = 'mapa') {
    return api.listar(token, 'estado=activas&page=0&size=100', endpoint);
  },

  /** Listado con los filtros del mapa (estado + prioridad + categoría → consulta con Specification). */
  listarFiltrado(token, endpoint = 'listar_filtrado') {
    const q = `estado=activas&prioridad=${pick(PRIORITIES)}&categoria=${encodeURIComponent(pick(CATEGORIES))}&size=20`;
    return api.listar(token, q, endpoint);
  },

  /** Detalle público con historial de estados y comentarios. */
  detalle(id, endpoint = 'detalle') {
    const target = id || 1 + Math.floor(Math.random() * MAX_INCIDENT_ID);
    return expect(http.get(`${BASE_URL}/api/incidents/${target}`, { tags: { endpoint } }), 200, endpoint);
  },

  crear(token, body = newIncident(), endpoint = 'crear') {
    return expect(
      http.post(`${BASE_URL}/api/incidents`, JSON.stringify(body), auth(token, endpoint)),
      201,
      endpoint,
    );
  },

  cambiarEstado(token, id, estado, motivo, endpoint = 'cambiar_estado') {
    const body = motivo ? { estado, motivo } : { estado };
    return expect(
      http.patch(`${BASE_URL}/api/incidents/${id}/status`, JSON.stringify(body), auth(token, endpoint)),
      200,
      endpoint,
    );
  },

  cambiarPrioridad(token, id, endpoint = 'cambiar_prioridad') {
    return expect(
      http.patch(
        `${BASE_URL}/api/incidents/${id}/priority`,
        JSON.stringify({ prioridad: pick(PRIORITIES) }),
        auth(token, endpoint),
      ),
      200,
      endpoint,
    );
  },

  comentar(token, id, endpoint = 'comentar') {
    return expect(
      http.post(
        `${BASE_URL}/api/incidents/${id}/comments`,
        JSON.stringify({ contenido: `Comentario k6 VU-${__VU}-${__ITER}` }),
        auth(token, endpoint),
      ),
      201,
      endpoint,
    );
  },

  activosCercanos(token, endpoint = 'activos_cercanos') {
    const { latitud, longitud } = randomPoint();
    return expect(
      http.get(
        `${BASE_URL}/api/urban-assets/nearby?latitud=${latitud}&longitud=${longitud}&radio=200`,
        auth(token, endpoint),
      ),
      200,
      endpoint,
    );
  },

  login(endpoint = 'login') {
    return login(USERS.citizen, { endpoint });
  },
};

// ---------------------------------------------------------------------------------------------
// Estado por VU para las operaciones de modificación.
// Cada VU crea su propia incidencia y la recorre por transiciones válidas (ADR-008), así no hay
// conflictos entre VUs y cada cambio de estado deja su registro en "StatusChange".
// ---------------------------------------------------------------------------------------------

let ownIncidentId = null;
let statusStep = 0;
// Abierta → En revisión → Resuelta → Reabierta → En revisión → Resuelta → Reabierta …
const STATUS_CYCLE = [
  { estado: 'En revisión' },
  { estado: 'Resuelta' },
  { estado: 'Reabierta', motivo: 'Reapertura generada por k6' },
];

export function ownIncident(tokens) {
  if (ownIncidentId === null) {
    const res = api.crear(tokens.citizen, newIncident(), 'setup');
    if (res.status !== 201) {
      return null;
    }
    ownIncidentId = res.json('id');
  }
  return ownIncidentId;
}

export function nextStatus(tokens, endpoint = 'cambiar_estado') {
  const id = ownIncident(tokens);
  if (id === null) return null;
  const { estado, motivo } = STATUS_CYCLE[statusStep % STATUS_CYCLE.length];
  statusStep += 1;
  return api.cambiarEstado(tokens.operator, id, estado, motivo, endpoint);
}

// ---------------------------------------------------------------------------------------------
// Umbrales y resumen
// ---------------------------------------------------------------------------------------------

/**
 * Umbrales globales + uno por endpoint/escenario. Los umbrales por etiqueta hacen que el resumen
 * de k6 muestre p50/p95/p99, peticiones y errores de cada operación por separado.
 * Las peticiones de preparación (endpoint "setup") quedan fuera de los umbrales globales.
 */
export function thresholds(endpoints = [], extra = {}) {
  const t = {
    'http_req_duration{endpoint:setup}': ['max>=0'],
    checks: ['rate>0.99'],
    ...extra,
  };
  for (const e of endpoints) {
    t[`http_req_duration{endpoint:${e}}`] = [`p(95)<${SLO_P95_MS}`];
    t[`http_req_failed{endpoint:${e}}`] = [`rate<${SLO_ERROR_RATE}`];
    t[`http_reqs{endpoint:${e}}`] = ['count>=0'];
  }
  return t;
}

/**
 * handleSummary común: resumen de texto por consola y JSON en SUMMARY_FILE (lo usa run.sh).
 * `meta` se guarda junto a las métricas (configuración y duraciones para calcular peticiones/s).
 */
export function makeSummary(meta = {}) {
  return function handleSummary(data) {
    const out = { stdout: textSummary(data, { indent: ' ', enableColors: true }) };
    const file = __ENV.SUMMARY_FILE;
    if (file) {
      out[file] = JSON.stringify({ meta: { ...meta, env: publicEnv() }, ...data }, null, 2);
    }
    return out;
  };
}

function publicEnv() {
  // Solo variables de configuración de las pruebas, nunca contraseñas.
  const keys = ['BASE_URL', 'OP', 'VUS', 'DURATION', 'RATE', 'THINK_TIME', 'MAP_VUS', 'READ_RATE',
    'CREATE_RATE', 'UPDATE_RATE', 'DATASET', 'INDICES', 'LABEL', 'MAX_INCIDENT_ID', 'TOTAL_INCIDENTS'];
  const env = {};
  for (const k of keys) if (__ENV[k] !== undefined) env[k] = __ENV[k];
  return env;
}
