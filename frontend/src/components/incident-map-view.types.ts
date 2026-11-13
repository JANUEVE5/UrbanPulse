import type { MutableRefObject } from 'react';

import type { UrbanAsset } from '@/services/urbanAssetService';

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

export interface IncidentMapViewProps {
  mapRef?: MutableRefObject<MapHandle | null>;
  region?: MapRegion;
  initialRegion?: MapRegion;
  onPress?: (event: MapPressEvent) => void;
  selectedCoordinate?: Coordinate | null;
  /** Activos urbanos que se dibujan como marcadores pequeños con el icono de su tipo. */
  urbanAssets?: UrbanAsset[];
  /** Al pulsar el marcador de un activo (por ejemplo, para elegirlo). */
  onUrbanAssetPress?: (asset: UrbanAsset) => void;
  /** Activo resaltado en el mapa. */
  selectedUrbanAssetId?: number | null;
}
