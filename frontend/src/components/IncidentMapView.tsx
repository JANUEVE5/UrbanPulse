import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import type { IncidentMapViewProps } from './incident-map-view.types';
import { extractStopName } from '@/services/urbanAssetService';

/** Mapa de incidencias para Android/iOS (react-native-maps + teselas de OpenStreetMap). */
export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
  urbanAssets,
  onUrbanAssetPress,
  selectedUrbanAssetId,
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

      {/* Marcadores de paradas de autobús (color azul distintivo) */}
      {urbanAssets?.map((asset) => {
        if (asset.latitud == null || asset.longitud == null) return null;
        const isSelected = selectedUrbanAssetId === asset.id;
        const stopName = extractStopName(asset);
        return (
          <Marker
            key={`urban-asset-${asset.id}`}
            coordinate={{ latitude: asset.latitud, longitude: asset.longitud }}
            title={stopName}
            description="Parada de autobús (EMT Málaga)"
            pinColor={isSelected ? '#1d4ed8' : '#3b82f6'}
            onPress={(e) => {
              // Evitar que el clic en la parada propague un clic genérico al mapa
              e?.stopPropagation?.();
              onUrbanAssetPress?.(asset);
            }}
          />
        );
      })}

      {/* Marcador del punto de la incidencia (color rojo) */}
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
