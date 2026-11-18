import { roundCoordinate } from '@/lib/coordinates';
import { apiRequest } from '@/services/apiClient';
import type { UrbanAsset } from '@/services/urbanAssetService';

export interface StatusChange {
  id: number;
  actorId: number;
  actorNombre?: string | null;
  transicion: string;
  motivo?: string | null;
  instante: string;
}

export interface IncidentComment {
  id: number;
  actorId: number;
  actorNombre?: string | null;
  contenido: string;
  createdAt: string;
}

export interface Incident {
  id: number;
  reporteCentral: string;
  titulo?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  urbanAssetId?: number | null;
  urbanAssetTipo?: string | null;
  urbanAsset?: UrbanAsset | null;
  localizacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  estado: string;
  prioridad: string;
  idCreador: number;
  nombreCreador?: string | null;
  correoCreador?: string | null;
  createdAt: string;
  historial?: StatusChange[];
  comentarios?: IncidentComment[];
}

export interface IncidentPage {
  content: Incident[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type IncidentPriority = 'Baja' | 'Media' | 'Alta';

export interface CreateIncidentInput {
  titulo: string;
  descripcion: string;
  categoria?: string;
  prioridad?: IncidentPriority;
  latitud: number;
  longitud: number;
  urbanAssetId?: number | null;
  localizacion?: string | null;
}

export interface IncidentFilterOptions {
  estado?: string;
  prioridad?: string;
  categoria?: string;
  limit?: number | null;
}

/** Incidencias visibles para el usuario autenticado según su rol, paginadas por fecha descendente. */
export function getIncidents(
  page = 0,
  size = 20,
  filters?: IncidentFilterOptions | string
): Promise<IncidentPage> {
  const options: IncidentFilterOptions = typeof filters === 'string' ? { estado: filters } : (filters || {});
  let query = `/incidents?page=${page}&size=${size}&sort=createdAt,desc`;
  if (options.estado && options.estado !== 'todas') {
    query += `&estado=${encodeURIComponent(options.estado)}`;
  }
  if (options.prioridad && options.prioridad !== 'todas') {
    query += `&prioridad=${encodeURIComponent(options.prioridad)}`;
  }
  if (options.categoria && options.categoria !== 'todas') {
    query += `&categoria=${encodeURIComponent(options.categoria)}`;
  }
  return apiRequest<IncidentPage>(query);
}

/** Carga las incidencias para el mapa ordenadas por fecha descendente respetando filtros y límite de elementos. */
export async function getAllIncidents(filters?: IncidentFilterOptions | string): Promise<Incident[]> {
  const options: IncidentFilterOptions = typeof filters === 'string' ? { estado: filters } : (filters || {});
  const targetLimit = options.limit ?? null;

  const pageSize = targetLimit && targetLimit <= 100 ? targetLimit : 100;
  const batchSize = 5;
  const firstPage = await getIncidents(0, pageSize, options);
  const incidents = [...firstPage.content];

  if (targetLimit && incidents.length >= targetLimit) {
    return incidents.slice(0, targetLimit);
  }

  for (
    let firstPageInBatch = 1;
    firstPageInBatch < firstPage.totalPages;
    firstPageInBatch += batchSize
  ) {
    if (targetLimit && incidents.length >= targetLimit) break;
    const pageNumbers = Array.from(
      { length: Math.min(batchSize, firstPage.totalPages - firstPageInBatch) },
      (_, index) => firstPageInBatch + index
    );
    const pages = await Promise.all(pageNumbers.map((page) => getIncidents(page, pageSize, options)));
    incidents.push(...pages.flatMap((result) => result.content));
    if (targetLimit && incidents.length >= targetLimit) {
      return incidents.slice(0, targetLimit);
    }
  }

  return targetLimit ? incidents.slice(0, targetLimit) : incidents;
}

export interface UpdateIncidentPriorityInput {
  prioridad: IncidentPriority;
}

export interface UpdateIncidentStatusInput {
  estado: string;
  motivo?: string;
}

/** Detalle de una incidencia con su historial (público). */
export function getIncidentById(id: number): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}`, {
    errorMessages: { 404: `La incidencia #${id} no existe.` },
  });
}

/** Registra una incidencia a nombre del usuario con sesión iniciada (requiere token). */
export function createIncident(input: CreateIncidentInput): Promise<Incident> {
  return apiRequest<Incident>('/incidents', {
    method: 'POST',
    // La API solo acepta 6 decimales; el GPS devuelve más (#47)
    body: {
      ...input,
      latitud: roundCoordinate(input.latitud),
      longitud: roundCoordinate(input.longitud),
    },
    errorMessages: { 401: 'Inicia sesión para registrar una incidencia.' },
  });
}

/**
 * Actualiza el estado de una incidencia y devuelve su historial actualizado.
 */
export function updateIncidentStatus(
  id: number,
  input: UpdateIncidentStatusInput
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: input,
  });
}

export function updateIncidentPriority(
  id: number,
  input: UpdateIncidentPriorityInput
): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/priority`, {
    method: 'PATCH',
    body: input,
  });
}

export function addIncidentComment(id: number, contenido: string): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/comments`, {
    method: 'POST',
    body: { contenido },
  });
}

/** Cambia o quita (urbanAssetId = null) el activo urbano asociado (OPERATOR o ADMIN, RF22). */
export function updateIncidentUrbanAsset(id: number, urbanAssetId: number | null): Promise<Incident> {
  return apiRequest<Incident>(`/incidents/${id}/urban-asset`, {
    method: 'PATCH',
    body: { urbanAssetId },
    errorMessages: { 400: 'El elemento elegido ya no existe o está demasiado lejos de la incidencia.' },
  });
}
