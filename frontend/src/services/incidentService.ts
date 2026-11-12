import type { UrbanAsset } from '@/components/incident-map-view.types';
import { apiRequest } from '@/services/apiClient';

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
  direccionNormalizada?: string | null;
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

/** Incidencias visibles para el usuario autenticado según su rol. */
export interface UpdateIncidentPriorityInput {
  prioridad: IncidentPriority;
}

export interface UpdateIncidentStatusInput {
  estado: string;
  motivo?: string;
}

/** Incidencias del usuario autenticado. */
export function getIncidents(): Promise<Incident[]> {
  return apiRequest<Incident[]>('/incidents');
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
    body: input,
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
