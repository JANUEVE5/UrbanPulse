/** Datos mínimos de una incidencia para pintarla en el mapa principal. */
export interface MapIncident {
  id: number;
  titulo: string;
  localizacion?: string | null;
  estado: string;
  latitud: number;
  longitud: number;
}

export interface IncidentsMapProps {
  incidents: MapIncident[];
  /** Se llama al pulsar la tarjeta de una incidencia: abre su detalle. */
  onOpenIncident: (id: number) => void;
}

/** Centro por defecto: Málaga. */
export const MALAGA_CENTER = { latitude: 36.721274, longitude: -4.421399 };
