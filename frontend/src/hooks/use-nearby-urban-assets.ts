import { useEffect, useState } from 'react';

import type { Coordinate } from '@/components/incident-map-view.types';
import { getNearbyUrbanAssets, type UrbanAsset } from '@/services/urbanAssetService';

interface NearbyUrbanAssets {
  assets: UrbanAsset[];
  loading: boolean;
  /** La búsqueda falló: la incidencia se puede registrar igualmente, sin activo (RF26). */
  failed: boolean;
}

interface Result {
  key: string;
  assets: UrbanAsset[];
  failed: boolean;
}

/** Activos urbanos cercanos a la coordenada; se vuelven a buscar cada vez que cambia. */
export function useNearbyUrbanAssets(coordinate: Coordinate | null): NearbyUrbanAssets {
  const latitude = coordinate?.latitude;
  const longitude = coordinate?.longitude;
  const key = latitude == null || longitude == null ? null : `${latitude},${longitude}`;
  // Resultado de la última búsqueda; si es de otra coordenada, la actual aún está cargando
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (key == null || latitude == null || longitude == null) return;
    // Si el usuario mueve el punto antes de que llegue la respuesta, se ignora la respuesta antigua
    let current = true;
    getNearbyUrbanAssets(latitude, longitude)
      .then((assets) => current && setResult({ key, assets, failed: false }))
      .catch(() => current && setResult({ key, assets: [], failed: true }));
    return () => {
      current = false;
    };
  }, [key, latitude, longitude]);

  if (key == null) return { assets: [], loading: false, failed: false };
  if (result?.key !== key) return { assets: [], loading: true, failed: false };
  return { assets: result.assets, loading: false, failed: result.failed };
}
