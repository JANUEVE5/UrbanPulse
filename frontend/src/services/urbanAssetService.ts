import { apiRequest } from '@/services/apiClient';
import { roundCoordinate } from '@/lib/coordinates';

/**
 * Activo urbano (parada, desfibrilador, contenedor…) sincronizado desde Open Data Málaga (RF22, ADR-015).
 * `distanciaMetros` y `confianza` solo llegan en la búsqueda de activos cercanos.
 */
export interface UrbanAsset {
  id: number;
  tipo: string;
  nombre?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  latitud: number;
  longitud: number;
  fuente?: string | null;
  distanciaMetros?: number;
  confianza?: 'Alta' | 'Media' | 'Baja';
}

/**
 * Activos a menos de 50 m del punto, del más cercano al más lejano. Si la API no responde, la incidencia
 * se puede registrar igualmente sin activo (RF26), así que quien llama debe tratar el error sin bloquear.
 */
export function getNearbyUrbanAssets(latitud: number, longitud: number): Promise<UrbanAsset[]> {
  const query = `latitud=${roundCoordinate(latitud)}&longitud=${roundCoordinate(longitud)}`;
  return apiRequest<UrbanAsset[]>(`/urban-assets/nearby?${query}`);
}
