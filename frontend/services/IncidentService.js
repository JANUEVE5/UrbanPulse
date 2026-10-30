import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api',
  default: 'http://localhost:8080/api',
});

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

/**
 * Servicio para la gestión y creación de incidencias urbanas.
 */
export const IncidentService = {
  /**
   * Envía una nueva incidencia al backend respetando la arquitectura de capas.
   * @param {Object} incidentData - Datos de la incidencia a crear
   * @param {string} incidentData.reporte - Texto explicativo del problema urbano
   * @param {string} [incidentData.prioridad] - 'Alta', 'Media' o 'Baja'
   * @param {Object} [incidentData.coordenadas] - { latitude, longitude }
   * @param {string} [incidentData.localizacion] - Dirección o coordenadas en formato texto
   * @returns {Promise<Object>} Datos de la incidencia creada devueltos por el backend
   */
  async createIncident(incidentData) {
    const url = `${API_BASE_URL}/incidents`;

    // Formateamos la localización si vienen coordenadas del mapa
    const localizacionStr =
      incidentData.localizacion ||
      (incidentData.coordenadas
        ? `${incidentData.coordenadas.latitude.toFixed(6)}, ${incidentData.coordenadas.longitude.toFixed(6)}`
        : null);

    const payload = {
      titulo: incidentData.titulo || (incidentData.reporte ? incidentData.reporte.slice(0, 50) : 'Nueva incidencia'),
      descripcion: incidentData.reporte || incidentData.descripcion,
      reporteCentral: incidentData.reporte || incidentData.descripcion,
      prioridad: incidentData.prioridad || 'Media',
      localizacion: localizacionStr,
      categoria: incidentData.categoria || 'Vía Pública',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en IncidentService.createIncident:', error);
      throw error;
    }
  },
};

export default IncidentService;

