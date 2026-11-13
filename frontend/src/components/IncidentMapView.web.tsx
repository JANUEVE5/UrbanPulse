import React, { useEffect, useRef } from 'react';

import type { IncidentMapViewProps, MapRegion } from './incident-map-view.types';
import { extractStopName } from '@/services/urbanAssetService';

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

  // 2. Renderizar marcadores de paradas de autobús (UrbanAssets)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = assetsLayerGroupRef.current;
    if (!map || !L || !layerGroup) return;

    layerGroup.clearLayers();

    if (!urbanAssets || urbanAssets.length === 0) return;

    urbanAssets.forEach((asset) => {
      if (asset.latitud == null || asset.longitud == null) return;

      const isSelected = selectedUrbanAssetId === asset.id;
      const stopName = extractStopName(asset);

      // Marcador azul distintivo para paradas EMT
      const blueIcon = L.divIcon({
        className: 'urban-asset-marker',
        html: `
          <div style="
            background-color: ${isSelected ? '#1d4ed8' : '#2563eb'};
            width: ${isSelected ? '20px' : '16px'};
            height: ${isSelected ? '20px' : '16px'};
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 5px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <span style="font-size: 9px; color: #ffffff; font-weight: bold; line-height: 1;">🚌</span>
          </div>
        `,
        iconSize: [isSelected ? 20 : 16, isSelected ? 20 : 16],
        iconAnchor: [isSelected ? 10 : 8, isSelected ? 10 : 8],
        popupAnchor: [0, -10],
      });

      const marker = L.marker([asset.latitud, asset.longitud], { icon: blueIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong style="color: #2563eb;">Parada EMT</strong><br/>
          <span>${stopName}</span><br/>
          <small style="color: #64748b;">Pulsa para asociar a la incidencia</small>
        </div>
      `);

      marker.on('click', () => {
        onUrbanAssetPress?.(asset);
      });

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
