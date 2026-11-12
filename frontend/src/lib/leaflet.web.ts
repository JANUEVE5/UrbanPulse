import { useEffect, useState } from 'react';

/**
 * Carga de Leaflet (mapas en web) desde CDN y tipos mínimos de la parte de su API que usa la app.
 * Leaflet no se instala como dependencia npm: se inyecta en el documento la primera vez que hace falta.
 */

const LEAFLET_VERSION = '1.9.4';
const CDN = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`;

export type LatLngTuple = [number, number];

export interface LeafletLatLng {
  lat: number;
  lng: number;
}

export interface LeafletPopup {
  getElement: () => HTMLElement | undefined;
}

export interface LeafletMarker {
  setLatLng: (latLng: LatLngTuple) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: HTMLElement | string, options?: Record<string, unknown>) => LeafletMarker;
  getPopup: () => LeafletPopup | undefined;
  on: (event: 'popupopen' | 'click', handler: () => void) => LeafletMarker;
}

export interface LeafletLayerGroup {
  addTo: (map: LeafletMap) => LeafletLayerGroup;
  clearLayers: () => void;
  addLayer: (layer: LeafletMarker) => void;
}

export interface LeafletMap {
  on: (event: 'click', handler: (e: { latlng: LeafletLatLng }) => void) => void;
  setView: (center: LatLngTuple, zoom: number, options?: { animate?: boolean }) => void;
  fitBounds: (
    bounds: LatLngTuple[],
    options?: { padding?: [number, number]; maxZoom?: number; animate?: boolean },
  ) => void;
  panTo: (center: LatLngTuple) => void;
  getZoom: () => number;
  invalidateSize: (options?: { animate?: boolean; pan?: boolean }) => void;
  removeLayer: (layer: LeafletMarker) => void;
  remove: () => void;
}

export interface LeafletStatic {
  map: (
    el: HTMLElement,
    options: { center: LatLngTuple; zoom: number; zoomControl: boolean },
  ) => LeafletMap;
  tileLayer: (url: string, options: { maxZoom: number; attribution: string }) => { addTo: (map: LeafletMap) => void };
  marker: (latLng: LatLngTuple, options?: { icon?: unknown; title?: string; alt?: string }) => LeafletMarker;
  layerGroup: () => LeafletLayerGroup;
  icon: (options: Record<string, unknown>) => unknown;
  divIcon: (options: { className?: string; html?: string; iconSize?: [number, number]; iconAnchor?: [number, number]; popupAnchor?: [number, number] }) => unknown;
  Marker: { prototype: { options: { icon?: unknown } } };
  control: {
    zoom: (options: { position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright' }) => {
      addTo: (map: LeafletMap) => void;
    };
  };
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}

export const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

let loading: Promise<LeafletStatic> | null = null;

function loadLeaflet(): Promise<LeafletStatic> {
  if (window.L) return Promise.resolve(window.L);
  if (loading) return loading;

  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = `${CDN}/leaflet.css`;
    document.head.appendChild(link);
  }

  loading = new Promise<LeafletStatic>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = `${CDN}/leaflet.js`;
    script.async = true;
    script.onload = () => {
      const L = window.L;
      if (!L) return reject(new Error('Leaflet no se ha cargado'));
      // Icono por defecto con URLs absolutas (evita iconos rotos)
      L.Marker.prototype.options.icon = L.icon({
        iconUrl: `${CDN}/images/marker-icon.png`,
        iconRetinaUrl: `${CDN}/images/marker-icon-2x.png`,
        shadowUrl: `${CDN}/images/marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      resolve(L);
    };
    script.onerror = () => reject(new Error('No se pudo descargar Leaflet'));
    document.body.appendChild(script);
  });
  return loading;
}

/** Devuelve Leaflet cuando está disponible (null mientras se carga). */
export function useLeaflet(): LeafletStatic | null {
  const [L, setL] = useState<LeafletStatic | null>(() =>
    typeof window !== 'undefined' && window.L ? window.L : null,
  );

  useEffect(() => {
    if (L || typeof window === 'undefined') return;
    let active = true;
    loadLeaflet()
      .then((lib) => active && setL(lib))
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, [L]);

  return L;
}
