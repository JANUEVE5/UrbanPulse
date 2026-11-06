import React, { useEffect, useRef, useState } from 'react';

import type { IncidentMapViewProps, MapRegion } from './incident-map-view.types';

/**
 * Mapa de incidencias para web, con Leaflet + OpenStreetMap.
 * Leaflet se carga desde CDN en tiempo de ejecución, así que solo se tipa la parte de su API que se usa.
 */
interface LeafletLatLng {
  lat: number;
  lng: number;
}
interface LeafletMarker {
  setLatLng: (latLng: [number, number]) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
}
interface LeafletMap {
  on: (event: 'click', handler: (e: { latlng: LeafletLatLng }) => void) => void;
  setView: (center: [number, number], zoom: number, options?: { animate?: boolean }) => void;
  panTo: (center: [number, number]) => void;
  getZoom: () => number;
  invalidateSize: () => void;
  removeLayer: (layer: LeafletMarker) => void;
  remove: () => void;
}
interface LeafletStatic {
  map: (el: HTMLElement, options: { center: [number, number]; zoom: number; zoomControl: boolean }) => LeafletMap;
  tileLayer: (url: string, options: { maxZoom: number; attribution: string }) => { addTo: (map: LeafletMap) => void };
  marker: (latLng: [number, number]) => LeafletMarker;
  icon: (options: Record<string, unknown>) => unknown;
  Marker: { prototype: { options: { icon?: unknown } } };
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}

const DEFAULT_CENTER = { latitude: 36.721274, longitude: -4.421399 };

export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
}: IncidentMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerInstanceRef = useRef<LeafletMarker | null>(null);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && !!window.L);

  const defaultLat =
    selectedCoordinate?.latitude ?? region?.latitude ?? initialRegion?.latitude ?? DEFAULT_CENTER.latitude;
  const defaultLng =
    selectedCoordinate?.longitude ?? region?.longitude ?? initialRegion?.longitude ?? DEFAULT_CENTER.longitude;

  // 1. Inyectar CSS y script de Leaflet en el documento si aún no existen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      document.body.appendChild(script);
    }
    // Si window.L ya existía, leafletReady se inicializa a true en el useState.
  }, []);

  // 2. Inicializar Leaflet cuando la librería esté lista y el contenedor montado
  useEffect(() => {
    const L = window.L;
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current || !L) {
      return;
    }

    // Icono por defecto con URLs absolutas para evitar iconos rotos
    L.Marker.prototype.options.icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

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
    const resizeTimer = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      // Evita que el temporizador actúe sobre un mapa ya destruido (error "_leaflet_pos")
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
    // Solo se inicializa una vez, cuando Leaflet está disponible
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // 3. Sincronizar el marcador cuando cambia la coordenada seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window.L;
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

  // 4. Centrar cuando cambia la región
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !region) return;
    map.setView([region.latitude, region.longitude], map.getZoom() || 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.latitude, region?.longitude]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
    />
  );
}
