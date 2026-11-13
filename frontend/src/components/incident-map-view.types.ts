import type { MutableRefObject } from 'react';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Coordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Evento de pulsación normalizado: misma forma en nativo (react-native-maps) y en web (Leaflet). */
export interface MapPressEvent {
  nativeEvent: { coordinate: Coordinate };
}

/** Subconjunto de la API del mapa que usan las pantallas, común a nativo y web. */
export interface MapHandle {
  animateToRegion: (region: MapRegion, duration?: number) => void;
}

/** Entidad de Activo Urbano (ej. Parada de Autobús de la EMT). */
export interface UrbanAsset {
  id: number;
  tipo: string;
  nombre?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  fuente?: string | null;
  metadatos?: string | null;
}

export interface IncidentMapViewProps {
  mapRef?: MutableRefObject<MapHandle | null>;
  region?: MapRegion;
  initialRegion?: MapRegion;
  onPress?: (event: MapPressEvent) => void;
  selectedCoordinate?: Coordinate | null;
  /** Lista de activos urbanos a renderizar como marcadores diferenciados (ej. azul). */
  urbanAssets?: UrbanAsset[];
  /** Callback al pulsar un marcador de activo urbano. */
  onUrbanAssetPress?: (asset: UrbanAsset) => void;
  /** ID del activo urbano actualmente seleccionado. */
  selectedUrbanAssetId?: number | null;
}
