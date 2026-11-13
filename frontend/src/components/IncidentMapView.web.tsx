import React, { useEffect, useRef } from 'react';

import type { IncidentMapViewProps, MapRegion } from './incident-map-view.types';
import { Brand } from '@/constants/theme';
import { urbanAssetType } from '@/constants/urban-assets';

import {
  OSM_ATTRIBUTION,
  OSM_TILES,
  useLeaflet,
  type LeafletLayerGroup,
  type LeafletMap,
  type LeafletMarker,
} from '@/lib/leaflet.web';

/** Mapa para elegir o mostrar la posición de UNA incidencia (formulario y detalle), con Leaflet. */

const DEFAULT_CENTER = { latitude: 36.721274, longitude: -4.421399 };

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
  const L = useLeaflet();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const incidentMarkerRef = useRef<LeafletMarker | null>(null);
  const assetsLayerGroupRef = useRef<LeafletLayerGroup | null>(null);

  const defaultLat =
    selectedCoordinate?.latitude ?? region?.latitude ?? initialRegion?.latitude ?? DEFAULT_CENTER.latitude;
  const defaultLng =
    selectedCoordinate?.longitude ?? region?.longitude ?? initialRegion?.longitude ?? DEFAULT_CENTER.longitude;

  // 1. Inicializar el mapa cuando Leaflet esté disponible
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: true,
    });
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);

    // Grupo de capas para activos urbanos (paradas EMT)
    const assetsLayer = L.layerGroup().addTo(map);
    assetsLayerGroupRef.current = assetsLayer;

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
      incidentMarkerRef.current = L.marker([selectedCoordinate.latitude, selectedCoordinate.longitude]).addTo(map);
    }

    // Asegura el renderizado correcto en contenedores dinámicos
    const container = mapContainerRef.current;
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      incidentMarkerRef.current = null;
      assetsLayerGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // 2. Activos urbanos: un círculo pequeño con el icono de su tipo; el elegido, relleno de azul
  useEffect(() => {
    const layerGroup = assetsLayerGroupRef.current;
    if (!mapInstanceRef.current || !L || !layerGroup) return;

    layerGroup.clearLayers();
    urbanAssets?.forEach((asset) => {
      const selected = selectedUrbanAssetId === asset.id;
      const size = selected ? 30 : 24;
      const icon = L.divIcon({
        className: 'urban-asset-marker',
        // Solo el icono (fijo) va en el HTML; el nombre, que viene de una fuente externa, no se inyecta
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;font-size:${selected ? 16 : 13}px;cursor:pointer;
          background:${selected ? Brand.blue : Brand.white};border:2px solid ${Brand.blue};
          box-shadow:0 1px 4px rgba(0,0,0,0.35);">${urbanAssetType(asset.tipo).icon}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker([asset.latitud, asset.longitud], {
        icon,
        alt: `${urbanAssetType(asset.tipo).label}: ${asset.nombre ?? ''}`,
      });
      marker.on('click', () => onUrbanAssetPress?.(asset));
      layerGroup.addLayer(marker);
    });
  }, [L, urbanAssets, selectedUrbanAssetId, onUrbanAssetPress]);

  // 3. Sincronizar el marcador cuando cambia la coordenada seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    if (selectedCoordinate) {
      const { latitude, longitude } = selectedCoordinate;
      if (incidentMarkerRef.current) {
        incidentMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        incidentMarkerRef.current = L.marker([latitude, longitude]).addTo(map);
      }
      map.panTo([latitude, longitude]);
    } else if (incidentMarkerRef.current) {
      map.removeLayer(incidentMarkerRef.current);
      incidentMarkerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L, selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

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
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        isolation: 'isolate',
      }}
    />
  );
}
