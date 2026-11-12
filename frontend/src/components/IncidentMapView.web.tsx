import React, { useEffect, useRef } from 'react';

import type { IncidentMapViewProps, MapRegion } from './incident-map-view.types';

import { OSM_ATTRIBUTION, OSM_TILES, useLeaflet, type LeafletMap, type LeafletMarker } from '@/lib/leaflet.web';

/** Mapa para elegir o mostrar la posición de UNA incidencia (formulario y detalle), con Leaflet. */

const DEFAULT_CENTER = { latitude: 36.721274, longitude: -4.421399 };

export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
}: IncidentMapViewProps) {
  const L = useLeaflet();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerInstanceRef = useRef<LeafletMarker | null>(null);

  const defaultLat =
    selectedCoordinate?.latitude ?? region?.latitude ?? initialRegion?.latitude ?? DEFAULT_CENTER.latitude;
  const defaultLng =
    selectedCoordinate?.longitude ?? region?.longitude ?? initialRegion?.longitude ?? DEFAULT_CENTER.longitude;

  // 1. Inicializar el mapa cuando Leaflet esté disponible
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, { center: [defaultLat, defaultLng], zoom: 15, zoomControl: true });
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);

    map.on('click', (e) => {
      onPress?.({
        nativeEvent: {
          coordinate: {
            latitude: Number(e.latlng.lat.toFixed(6)),
            longitude: Number(e.latlng.lng.toFixed(6)),
          },
        },
      });
    });

    mapInstanceRef.current = map;

    // Adaptador para que las pantallas usen animateToRegion igual que en nativo
    if (mapRef) {
      mapRef.current = {
        animateToRegion: (target: MapRegion) => {
          mapInstanceRef.current?.setView([target.latitude, target.longitude], 16, { animate: true });
        },
      };
    }

    if (selectedCoordinate) {
      markerInstanceRef.current = L.marker([selectedCoordinate.latitude, selectedCoordinate.longitude]).addTo(map);
    }

    // Asegura el renderizado correcto en contenedores dinámicos
    // Recalcula el tamaño cuando cambia el contenedor (al cargar, al rotar o redimensionar la ventana);
    // si no, Leaflet solo pinta las teselas del tamaño inicial
    const container = mapContainerRef.current;
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
    // Solo se inicializa una vez, cuando Leaflet está disponible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // 2. Sincronizar el marcador cuando cambia la coordenada seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    if (selectedCoordinate) {
      const { latitude, longitude } = selectedCoordinate;
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
      } else {
        markerInstanceRef.current = L.marker([latitude, longitude]).addTo(map);
      }
      map.panTo([latitude, longitude]);
    } else if (markerInstanceRef.current) {
      map.removeLayer(markerInstanceRef.current);
      markerInstanceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

  // 3. Centrar cuando cambia la región
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !region) return;
    map.setView([region.latitude, region.longitude], map.getZoom() || 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.latitude, region?.longitude]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, isolation: 'isolate' }}
    />
  );
}
