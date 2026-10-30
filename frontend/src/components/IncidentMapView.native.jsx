import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
}) {
  return (
    <MapView
      ref={mapRef}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

