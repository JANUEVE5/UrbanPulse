import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, UrlTile } from 'react-native-maps';

import { MALAGA_CENTER, type IncidentsMapProps } from './incidents-map.types';

import { Brand, Colors } from '@/constants/theme';

/**
 * Mapa principal de incidencias en Android/iOS (react-native-maps + OpenStreetMap).
 * - Primer toque en el marcador: tarjeta (callout) encima con título, calle y estado.
 * - Toque en la tarjeta: abre el detalle.
 */
export default function IncidentsMap({ incidents, onOpenIncident }: IncidentsMapProps) {
  const mapRef = useRef<MapView | null>(null);

  // Encuadrar todas las incidencias cuando llegan
  useEffect(() => {
    if (!mapRef.current || incidents.length === 0) return;
    mapRef.current.fitToCoordinates(
      incidents.map((i) => ({ latitude: i.latitud, longitude: i.longitud })),
      { edgePadding: { top: 120, right: 60, bottom: 140, left: 60 }, animated: false },
    );
  }, [incidents]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={{ ...MALAGA_CENTER, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
      mapType={Platform.OS === 'android' ? 'none' : 'standard'}>
      <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          coordinate={{ latitude: incident.latitud, longitude: incident.longitud }}
          pinColor={Brand.orange}
          onCalloutPress={() => onOpenIncident(incident.id)}>
          <Callout tooltip>
            <View style={styles.card} accessibilityRole="button" accessibilityLabel={`Abrir el detalle de ${incident.titulo}`}>
              <Text style={styles.title} numberOfLines={2}>
                {incident.titulo}
              </Text>
              {incident.localizacion ? (
                <Text style={styles.street} numberOfLines={2}>
                  {incident.localizacion}
                </Text>
              ) : null}
              <View style={styles.footer}>
                <Text style={styles.status}>{incident.estado}</Text>
                <Text style={styles.open}>Ver detalle</Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    padding: 12,
    gap: 6,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  street: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.blue,
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  open: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.blue,
  },
});
