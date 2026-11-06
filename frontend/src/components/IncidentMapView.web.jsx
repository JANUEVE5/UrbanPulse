import React, { useEffect, useRef, useState } from 'react';

export default function IncidentMapView({
  mapRef,
  region,
  initialRegion,
  onPress,
  selectedCoordinate,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(
    typeof window !== 'undefined' && !!window.L
  );

  const defaultLat =
    selectedCoordinate?.latitude ??
    region?.latitude ??
    initialRegion?.latitude ??
    36.721274;
  const defaultLng =
    selectedCoordinate?.longitude ??
    region?.longitude ??
    initialRegion?.longitude ??
    -4.421399;

  // 1. Inyectar CSS y script de Leaflet en el documento Web si aún no existen
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
      script.onload = () => {
        setLeafletReady(true);
      };
      document.body.appendChild(script);
    } else if (window.L) {
      setLeafletReady(true);
    }
  }, []);

  // 2. Inicializar Leaflet cuando la librería esté lista y el contenedor montado
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current || !window.L) {
      return;
    }

    // Configurar icono por defecto con URLs absolutas para evitar iconos rotos en Leaflet
    const defaultIcon = window.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    window.L.Marker.prototype.options.icon = defaultIcon;

    const map = window.L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: true,
    });

    // Capa de teselas OpenStreetMap
    window.L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Evento de clic en el mapa de Leaflet
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (onPress) {
        onPress({
          nativeEvent: {
            coordinate: {
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            },
          },
        });
      }
    });

    mapInstanceRef.current = map;

    // Conectar el adaptador mapRef si se proporciona para compatibilidad con animateToRegion
    if (mapRef) {
      mapRef.current = {
        animateToRegion: (targetRegion) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(
              [targetRegion.latitude, targetRegion.longitude],
              16,
              { animate: true }
            );
          }
        },
      };
    }

    // Si ya había una coordenada seleccionada al montar, crear el marcador
    if (selectedCoordinate) {
      markerInstanceRef.current = window.L.marker([
        selectedCoordinate.latitude,
        selectedCoordinate.longitude,
      ]).addTo(map);
    }

    // Invalidate size para asegurar renderizado correcto en contenedores dinámicos
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, [leafletReady]);

  // 3. Sincronizar marcador cuando selectedCoordinate cambia
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    if (selectedCoordinate) {
      const { latitude, longitude } = selectedCoordinate;
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([latitude, longitude]);
      } else {
        markerInstanceRef.current = window.L.marker([latitude, longitude]).addTo(
          mapInstanceRef.current
        );
      }
      mapInstanceRef.current.panTo([latitude, longitude]);
    } else if (markerInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerInstanceRef.current);
      markerInstanceRef.current = null;
    }
  }, [selectedCoordinate?.latitude, selectedCoordinate?.longitude]);

  // 4. Centrar cuando cambie la región
  useEffect(() => {
    if (!mapInstanceRef.current || !region) return;
    mapInstanceRef.current.setView(
      [region.latitude, region.longitude],
      mapInstanceRef.current.getZoom() || 15
    );
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
        zIndex: 1,
      }}
    />
  );
}
