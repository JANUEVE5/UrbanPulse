import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import type { IncidentMapViewProps } from './incident-map-view.types';

/** Mapa de incidencias para Android/iOS (react-native-maps + teselas de OpenStreetMap). */
export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
}: IncidentMapViewProps) {
  return (
    <MapView
      ref={(instance) => {
        if (mapRef) mapRef.current = instance;
      }}
      style={styles.map}
      initialRegion={initialRegion}
      region={region}
      onPress={onPress}
      mapType={Platform.OS === 'android' ? 'none' : 'standard'}>
      <UrlTile
        urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
      />
      {selectedCoordinate && (
        <Marker
          coordinate={selectedCoordinate}
          title="Punto de la Incidencia"
          description={`${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`}
          pinColor="#ef4444"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: StyleSheet.absoluteFill,
});
