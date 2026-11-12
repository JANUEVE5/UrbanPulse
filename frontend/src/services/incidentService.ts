import { apiRequest } from '@/services/apiClient';

export interface StatusChange {
  id: number;
  actorId: number;
  actorNombre?: string | null;
  transicion: string;
  motivo?: string | null;
  instante: string;
}

export interface Incident {
  id: number;
  reporteCentral: string;
  titulo?: string | null;
  descripcion?: string | null;
  categoria?: string | null;
  urbanAssetId?: number | null;
  urbanAssetTipo?: string | null;
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
}

export interface CreateIncidentInput {
  titulo: string;
  descripcion: string;
  categoria?: string;
  latitud: number;
  longitud: number;
}

/** Incidencias visibles para el usuario autenticado según su rol. */
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
