/** Nombre e icono de cada tipo de activo urbano (los códigos vienen de la API, ADR-015). */
export const URBAN_ASSET_TYPES: Record<string, { label: string; icon: string }> = {
  PARADA_AUTOBUS: { label: 'Parada de autobús', icon: '🚌' },
  PARADA_TAXI: { label: 'Parada de taxi', icon: '🚕' },
  APARCAMIENTO_BICI: { label: 'Aparcamiento de bicicletas', icon: '🚲' },
  APARCAMIENTO_MOTO: { label: 'Aparcamiento de motos', icon: '🛵' },
  APARCAMIENTO_PMR: { label: 'Plaza para movilidad reducida', icon: '♿' },
  CARGADOR_VEHICULO_ELECTRICO: { label: 'Cargador de vehículo eléctrico', icon: '🔌' },
  SEMAFORO: { label: 'Semáforo', icon: '🚦' },
  CAMARA_TRAFICO: { label: 'Cámara de tráfico', icon: '📹' },
  PANEL_MENSAJES: { label: 'Panel de mensajes', icon: '🪧' },
  FOTO_ROJO: { label: 'Cámara foto-rojo', icon: '📸' },
  DESFIBRILADOR: { label: 'Desfibrilador', icon: '❤️' },
  HIDRANTE: { label: 'Hidrante', icon: '🧯' },
  FUENTE_AGUA: { label: 'Fuente de agua potable', icon: '🚰' },
  CONTENEDOR_RSU: { label: 'Contenedor de residuos', icon: '🗑️' },
  CONTENEDOR_ENVASES: { label: 'Contenedor de envases', icon: '♻️' },
  CONTENEDOR_PAPEL: { label: 'Contenedor de papel', icon: '📦' },
  CONTENEDOR_VIDRIO: { label: 'Contenedor de vidrio', icon: '🍾' },
  CONTENEDOR_ROPA: { label: 'Contenedor de ropa', icon: '👕' },
  CONTENEDOR_ACEITE: { label: 'Contenedor de aceite', icon: '🛢️' },
  CONTENEDOR_PILAS: { label: 'Contenedor de pilas', icon: '🔋' },
  ZONA_MUSCULACION: { label: 'Zona de musculación', icon: '🏋️' },
  PARQUE_CANINO: { label: 'Parque canino', icon: '🐕' },
};

/** Nombre e icono del tipo; si la API añade un tipo nuevo, se muestra su código. */
export function urbanAssetType(tipo: string | null | undefined): { label: string; icon: string } {
  return (tipo && URBAN_ASSET_TYPES[tipo]) || { label: tipo ?? 'Activo urbano', icon: '📍' };
}
