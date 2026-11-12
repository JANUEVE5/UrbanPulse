import type { UrbanAsset } from '@/components/incident-map-view.types';
import { apiRequest } from '@/services/apiClient';

/**
 * Catálogo mínimo de respaldo de paradas EMT en Málaga (datos oficiales OpenData Málaga).
 * Asegura la degradación controlada (RF26 / ADR-004) si el backend o la base de datos estuviesen inaccesibles.
 */
export const DEFAULT_MALAGA_EMT_STOPS: UrbanAsset[] = [
  {
    id: 101,
    tipo: 'BUS_STOP',
    nombre: 'Alameda Principal - Norte',
    latitud: 36.71891,
    longitud: -4.42345,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '101',
      nombreParada: 'Alameda Principal - Norte',
      lineas: '1, 3, 11, C1',
      direccion: 'Alameda Principal, 1',
    }),
  },
  {
    id: 102,
    tipo: 'BUS_STOP',
    nombre: 'Alameda Principal - Sur',
    latitud: 36.71885,
    longitud: -4.4231,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '102',
      nombreParada: 'Alameda Principal - Sur',
      lineas: '4, 14, 19, 25',
      direccion: 'Alameda Principal, 22',
    }),
  },
  {
    id: 103,
    tipo: 'BUS_STOP',
    nombre: 'Paseo del Parque - Ayuntamiento',
    latitud: 36.7196,
    longitud: -4.4182,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '103',
      nombreParada: 'Paseo del Parque - Ayuntamiento',
      lineas: '1, 3, 11, 35, 37',
      direccion: 'Paseo del Parque, 1',
    }),
  },
  {
    id: 104,
    tipo: 'BUS_STOP',
    nombre: 'Plaza de la Marina',
    latitud: 36.7187,
    longitud: -4.4208,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '104',
      nombreParada: 'Plaza de la Marina',
      lineas: '1, 3, 4, 11, 14, 16, 25, 37',
      direccion: 'Plaza de la Marina, 2',
    }),
  },
  {
    id: 105,
    tipo: 'BUS_STOP',
    nombre: 'Calle Marqués de Larios',
    latitud: 36.7203,
    longitud: -4.4215,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '105',
      nombreParada: 'Calle Marqués de Larios',
      lineas: 'C1, 36',
      direccion: 'Calle Marqués de Larios, 10',
    }),
  },
  {
    id: 106,
    tipo: 'BUS_STOP',
    nombre: 'Plaza de la Merced',
    latitud: 36.7236,
    longitud: -4.4179,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '106',
      nombreParada: 'Plaza de la Merced',
      lineas: '1, 36, 37',
      direccion: 'Plaza de la Merced, 8',
    }),
  },
  {
    id: 107,
    tipo: 'BUS_STOP',
    nombre: 'Calle Carretería - Álamos',
    latitud: 36.7241,
    longitud: -4.4229,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '107',
      nombreParada: 'Calle Carretería - Álamos',
      lineas: '36, C1',
      direccion: 'Calle Carretería, 62',
    }),
  },
  {
    id: 108,
    tipo: 'BUS_STOP',
    nombre: 'Calle Hilera - Cruz de Humilladero',
    latitud: 36.7181,
    longitud: -4.4296,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '108',
      nombreParada: 'Calle Hilera - Cruz de Humilladero',
      lineas: '8, 21, 23, 31',
      direccion: 'Calle Hilera, 10',
    }),
  },
  {
    id: 115,
    tipo: 'BUS_STOP',
    nombre: 'Estación María Zambrano / Vialia',
    latitud: 36.7118,
    longitud: -4.4322,
    fuente: 'OpenData Málaga - EMT',
    metadatos: JSON.stringify({
      codParada: '115',
      nombreParada: 'Estación María Zambrano / Vialia',
      lineas: '1, 3, 5, 9, 10, C1, C2',
      direccion: 'Explanada de la Estación',
    }),
  },
];

/**
 * Obtiene la lista de activos urbanos desde el endpoint GET /api/urban-assets.
 * Si la petición falla, devuelve el catálogo de respaldo para garantizar disponibilidad (RF26).
 */
export async function getUrbanAssets(tipo = 'BUS_STOP'): Promise<UrbanAsset[]> {
  try {
    const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    const assets = await apiRequest<UrbanAsset[]>(`/urban-assets${query}`);
    if (assets && assets.length > 0) {
      return assets;
    }
    return DEFAULT_MALAGA_EMT_STOPS;
  } catch (error) {
    console.warn('No se pudieron obtener activos urbanos del backend, usando catálogo de respaldo:', error);
    return DEFAULT_MALAGA_EMT_STOPS;
  }
}

/**
 * Extrae el nombre humano de la parada a partir de su entidad o de su JSON de metadatos.
 */
export function extractStopName(asset: UrbanAsset | null | undefined): string {
  if (!asset) return '';
  if (asset.nombre && asset.nombre.trim()) {
    return asset.nombre.trim();
  }
  if (asset.metadatos) {
    try {
      const parsed = typeof asset.metadatos === 'string' ? JSON.parse(asset.metadatos) : asset.metadatos;
      if (parsed.nombreParada) return String(parsed.nombreParada);
      if (parsed.nombre) return String(parsed.nombre);
    } catch {
      // Ignora error de parseo JSON
    }
  }
  return `Parada #${asset.id}`;
}

/**
 * Extrae las líneas asociadas a la parada desde los metadatos JSON.
 */
export function extractStopLines(asset: UrbanAsset | null | undefined): string | null {
  if (!asset || !asset.metadatos) return null;
  try {
    const parsed = typeof asset.metadatos === 'string' ? JSON.parse(asset.metadatos) : asset.metadatos;
    if (parsed.lineas) return String(parsed.lineas);
  } catch {
    // Ignora error de parseo JSON
  }
  return null;
}
