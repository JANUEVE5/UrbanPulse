import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

import type { IncidentMapViewProps } from './incident-map-view.types';
import { Brand } from '@/constants/theme';
import { urbanAssetType } from '@/constants/urban-assets';

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

      {/* Activos urbanos cercanos: azul, y el elegido más oscuro */}
      {urbanAssets?.map((asset) => (
        <Marker
          key={`urban-asset-${asset.id}`}
          coordinate={{ latitude: asset.latitud, longitude: asset.longitud }}
          title={`${urbanAssetType(asset.tipo).icon} ${urbanAssetType(asset.tipo).label}`}
          description={asset.nombre ?? undefined}
          pinColor={selectedUrbanAssetId === asset.id ? Brand.blue : 'azure'}
          onPress={(e) => {
            // Que pulsar el activo no cuente también como pulsar el mapa (movería el punto)
            e.stopPropagation();
            onUrbanAssetPress?.(asset);
          }}
        />
      ))}

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
