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

export interface IncidentMapViewProps {
  mapRef?: MutableRefObject<MapHandle | null>;
  region?: MapRegion;
  initialRegion?: MapRegion;
  onPress?: (event: MapPressEvent) => void;
  selectedCoordinate?: Coordinate | null;
}
