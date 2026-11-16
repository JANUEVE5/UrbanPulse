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

/** Incidencias visibles para el usuario autenticado según su rol, paginadas por fecha descendente. */
export function getIncidents(page = 0, size = 20): Promise<IncidentPage> {
  return apiRequest<IncidentPage>(
    `/incidents?page=${page}&size=${size}&sort=createdAt,desc`
  );
}

/** Carga todas las páginas para mantener completos los marcadores del mapa. */
export async function getAllIncidents(): Promise<Incident[]> {
  const pageSize = 100;
  const batchSize = 5;
  const firstPage = await getIncidents(0, pageSize);
  const incidents = [...firstPage.content];

  for (
    let firstPageInBatch = 1;
    firstPageInBatch < firstPage.totalPages;
    firstPageInBatch += batchSize
  ) {
    const pageNumbers = Array.from(
      { length: Math.min(batchSize, firstPage.totalPages - firstPageInBatch) },
      (_, index) => firstPageInBatch + index
    );
    const pages = await Promise.all(pageNumbers.map((page) => getIncidents(page, pageSize)));
    incidents.push(...pages.flatMap((result) => result.content));
  }

  return incidents;
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
