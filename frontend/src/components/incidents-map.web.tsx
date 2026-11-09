import React, { useEffect, useRef } from 'react';

import { MALAGA_CENTER, type IncidentsMapProps, type MapIncident } from './incidents-map.types';

import { Brand } from '@/constants/theme';
import {
  OSM_ATTRIBUTION,
  OSM_TILES,
  useLeaflet,
  type LeafletLayerGroup,
  type LeafletMap,
  type LeafletStatic,
} from '@/lib/leaflet.web';

/**
 * Mapa principal de incidencias en web (Leaflet + OpenStreetMap).
 * - Un marcador naranja por incidencia.
 * - Primer clic en el marcador: tarjeta (popup) encima con título, calle y estado.
 * - Clic en la tarjeta: abre el detalle.
 */
export default function IncidentsMap({ incidents, onOpenIncident }: IncidentsMapProps) {
  const L = useLeaflet();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletLayerGroup | null>(null);
  const fittedRef = useRef(false);
  // Última versión del callback, para no recrear los marcadores si cambia su identidad
  const onOpenRef = useRef(onOpenIncident);
  useEffect(() => {
    onOpenRef.current = onOpenIncident;
  }, [onOpenIncident]);

  // 1. Crear el mapa una vez
  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [MALAGA_CENTER.latitude, MALAGA_CENTER.longitude],
      zoom: 14,
      zoomControl: false,
    });
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    // Zoom abajo a la izquierda: arriba quedan el menú y el botón de lista, abajo a la derecha el de crear
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Recalcula el tamaño cuando cambia el contenedor (al cargar, al rotar o redimensionar la ventana);
    // si no, Leaflet solo pinta las teselas del tamaño inicial
    const container = containerRef.current;
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      fittedRef.current = false;
    };
  }, [L]);

  // 2. Pintar los marcadores cuando cambian las incidencias
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();
    const icon = createPinIcon(L);
    for (const incident of incidents) {
      const marker = L.marker([incident.latitud, incident.longitud], {
        icon,
        title: incident.titulo,
        alt: incident.titulo,
      });
      marker.bindPopup(createCard(incident, () => onOpenRef.current(incident.id)), {
        closeButton: false,
        minWidth: 220,
        maxWidth: 280,
        offset: [0, -6],
      });
      layer.addLayer(marker);
    }

    // Encuadrar todas las incidencias la primera vez
    if (!fittedRef.current && incidents.length > 0) {
      map.invalidateSize({ animate: false });
      map.fitBounds(
        incidents.map((i) => [i.latitud, i.longitud] as [number, number]),
        // Sin animación: si se interrumpe con un cambio de tamaño, Leaflet descoloca las teselas
        { padding: [32, 32], maxZoom: 16, animate: false },
      );
      fittedRef.current = true;
    }
  }, [L, incidents]);

  // isolation: las capas internas de Leaflet (z-index 200–700) no tapan los botones flotantes de la pantalla
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0, isolation: 'isolate' }} />;
}

/** Marcador en forma de gota con el naranja del logo. */
function createPinIcon(L: LeafletStatic) {
  return L.divIcon({
    className: 'up-pin',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${Brand.orange};border:2px solid ${Brand.white};box-shadow:0 2px 6px rgba(16,79,133,.45);
      display:flex;align-items:center;justify-content:center">
      <div style="width:8px;height:8px;border-radius:50%;background:${Brand.white}"></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 30],
    popupAnchor: [0, -30],
  });
}

/** Tarjeta de la incidencia. Se construye con nodos DOM (textContent) para no inyectar HTML del usuario. */
function createCard(incident: MapIncident, onOpen: () => void): HTMLElement {
  const card = document.createElement('div');
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Abrir el detalle de la incidencia ${incident.titulo}`);
  card.style.cssText = 'cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:6px';

  const title = document.createElement('strong');
  title.textContent = incident.titulo;
  title.style.cssText = `font-size:15px;line-height:20px;color:#1B2733`;
  card.appendChild(title);

  if (incident.localizacion) {
    const street = document.createElement('span');
    street.textContent = incident.localizacion;
    street.style.cssText = 'font-size:13px;line-height:18px;color:#5B6875';
    card.appendChild(street);
  }

  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px';
  const status = document.createElement('span');
  status.textContent = incident.estado;
  status.style.cssText = `font-size:12px;font-weight:600;color:${Brand.blue};background:#E3ECF5;border-radius:10px;padding:2px 8px`;
  const open = document.createElement('span');
  open.textContent = 'Ver detalle';
  open.style.cssText = `font-size:13px;font-weight:700;color:${Brand.blue}`;
  footer.append(status, open);
  card.appendChild(footer);

  card.addEventListener('click', onOpen);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  });
  return card;
}
