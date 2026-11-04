import { Platform } from 'react-native';

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
  estado: string;
  prioridad: string;
  idCreador: number;
  nombreCreador?: string | null;
  correoCreador?: string | null;
  createdAt: string;
  historial?: StatusChange[];
}

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api',
  default: 'http://localhost:8080/api',
});

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export interface CreateIncidentInput {
  titulo: string;
  descripcion: string;
  categoria?: string;
}

/**
 * Obtiene todas las incidencias registradas en el backend.
 */
export async function getIncidents(): Promise<Incident[]> {
  const url = `${API_BASE_URL}/incidents`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching incidents from:', url, error);
    if (error?.message?.includes('NetworkError') || error?.name === 'TypeError') {
      throw new Error(
        `No se pudo conectar con el servidor en ${url}. Verifica que el backend Spring Boot esté reiniciado y en ejecución.`
      );
    }
    throw error;
  }
}

/**
 * Obtiene el detalle de una incidencia por su identificador.
 */
export async function getIncidentById(id: number): Promise<Incident> {
  const url = `${API_BASE_URL}/incidents/${id}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new Error(`Incidencia #${id} no encontrada.`);
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Error fetching incident #${id} from:`, url, error);
    if (error?.message?.includes('NetworkError') || error?.name === 'TypeError') {
      throw new Error(
        `No se pudo conectar con el servidor en ${url}. Verifica que el backend Spring Boot esté reiniciado y en ejecución.`
      );
    }
    throw error;
  }
}

/**
 * Registra una incidencia y devuelve el recurso creado.
 */
export async function createIncident(input: CreateIncidentInput): Promise<Incident> {
  const url = `${API_BASE_URL}/incidents`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(responseBody || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Error creating incident at:', url, error);
    if (error instanceof TypeError) {
      throw new Error(
        `No se pudo conectar con el servidor en ${url}. Verifica que el backend Spring Boot esté reiniciado y en ejecución.`
      );
    }
    throw error;
  }
}
