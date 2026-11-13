import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import IncidentMapView from '@/components/IncidentMapView';
import type { Coordinate, MapHandle, MapPressEvent, UrbanAsset } from '@/components/incident-map-view.types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createIncident, type IncidentPriority } from '@/services/incidentService';
import { extractStopLines, extractStopName, getUrbanAssets } from '@/services/urbanAssetService';

interface CreateIncidentFormProps {
  onCancel: () => void;
  onCreated: () => Promise<void>;
}

const INITIAL_REGION = {
  latitude: 36.721274,
  longitude: -4.421399,
  latitudeDelta: 0.015,
  longitudeDelta: 0.015,
};

const PRIORITIES = [
  { label: 'Baja', value: 'Baja', color: '#10b981' },
  { label: 'Media', value: 'Media', color: '#f59e0b' },
  { label: 'Alta', value: 'Alta', color: '#ef4444' },
] as const;

/** Muestra un aviso: alert() en web y Alert.alert() en nativo. */
function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    alert(message);
  } else {
    Alert.alert(title, message);
  }
}

export function CreateIncidentForm({ onCancel, onCreated }: CreateIncidentFormProps) {
  const theme = useTheme();
  const mapRef = useRef<MapHandle | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [prioridad, setPrioridad] = useState<IncidentPriority>('Media');
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);

  // Estado para activos urbanos (paradas EMT)
  const [urbanAssets, setUrbanAssets] = useState<UrbanAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(true);
  const [selectedUrbanAsset, setSelectedUrbanAsset] = useState<UrbanAsset | null>(null);

  const [region, setRegion] = useState(INITIAL_REGION);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Carga inicial de activos urbanos (paradas de autobús EMT)
  useEffect(() => {
    let isMounted = true;
    getUrbanAssets('BUS_STOP')
      .then((data) => {
        if (isMounted) {
          setUrbanAssets(data);
        }
      })
      .catch((err) => {
        console.error('Error al cargar paradas EMT:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingAssets(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Manejador al tocar en el mapa libremente
  const handleMapPress = (event: MapPressEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    if (coordinate) {
      setSelectedCoordinate(coordinate);
    }
  };

  // Manejador al pulsar sobre un marcador de parada EMT (asociación explícita)
  const handleUrbanAssetPress = (asset: UrbanAsset) => {
    if (asset.latitud != null && asset.longitud != null) {
      const coord = {
        latitude: asset.latitud,
        longitude: asset.longitud,
      };
      setSelectedCoordinate(coord);
      setSelectedUrbanAsset(asset);

      // Centrar suavemente en la parada seleccionada
      mapRef.current?.animateToRegion({
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleDeselectAsset = () => {
    setSelectedUrbanAsset(null);
  };

  // Geolocalización con expo-location
  const handleGetCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const msg = 'Se requiere permiso de ubicación para situar la incidencia en tu posición.';
        showMessage('Permiso denegado', msg);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newCoord = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setSelectedCoordinate(newCoord);

      const targetRegion = {
        latitude: newCoord.latitude,
        longitude: newCoord.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(targetRegion);
      mapRef.current?.animateToRegion(targetRegion);
    } catch (err) {
      console.error('Error al obtener la posición actual:', err);
      const msg = 'No se pudo obtener la ubicación actual del dispositivo.';
      showMessage('Error', msg);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    const cleanTitle = titulo.trim();
    const cleanDescription = descripcion.trim();

    if (!cleanTitle || !cleanDescription) {
      setError('El título y la descripción son obligatorios.');
      return;
    }

    if (!selectedCoordinate) {
      setError('Selecciona en el mapa la ubicación de la incidencia.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createIncident({
        titulo: cleanTitle,
        descripcion: cleanDescription,
        ...(categoria.trim() ? { categoria: categoria.trim() } : {}),
        prioridad,
        latitud: selectedCoordinate.latitude,
        longitud: selectedCoordinate.longitude,
        urbanAssetId: selectedUrbanAsset?.id ?? null,
      });
      await onCreated();
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo registrar la incidencia.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Registrar incidencia</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Selecciona la ubicación en el mapa o pulsa una parada de autobús (marcador azul) para asociarla.
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.form}>
        {/* Mapa con paradas EMT y punto de incidencia */}
        <View style={styles.mapContainer}>
          <IncidentMapView
            mapRef={mapRef}
            initialRegion={INITIAL_REGION}
            region={region}
            onPress={handleMapPress}
            selectedCoordinate={selectedCoordinate}
            urbanAssets={urbanAssets}
            onUrbanAssetPress={handleUrbanAssetPress}
            selectedUrbanAssetId={selectedUrbanAsset?.id}
          />

          {/* Indicador de carga de paradas */}
          {loadingAssets ? (
            <View style={styles.assetsLoadingBadge}>
              <ActivityIndicator size="small" color="#2563eb" />
              <ThemedText type="small" style={styles.assetsLoadingText}>
                Cargando paradas EMT...
              </ThemedText>
            </View>
          ) : null}

          {/* Botón flotante para obtener ubicación actual */}
          <Pressable
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
            ]}
            onPress={handleGetCurrentLocation}
            disabled={isLocating}>
            {isLocating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.locationButtonText}>
                📍 Mi ubicación
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Tarjeta de activo urbano seleccionado si se ha pulsado una parada */}
        {selectedUrbanAsset ? (
          <View style={styles.selectedAssetCard}>
            <View style={styles.selectedAssetInfo}>
              <ThemedText type="smallBold" style={styles.selectedAssetBadge}>
                🚌 Parada de Autobús Seleccionada
              </ThemedText>
              <ThemedText type="default" style={{ fontWeight: '600' }}>
                {extractStopName(selectedUrbanAsset)}
              </ThemedText>
              {extractStopLines(selectedUrbanAsset) ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Líneas: {extractStopLines(selectedUrbanAsset)}
                </ThemedText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Desvincular parada"
              onPress={handleDeselectAsset}
              style={({ pressed }) => [styles.deselectButton, pressed && styles.pressed]}>
              <ThemedText type="small" style={styles.deselectButtonText}>
                Desvincular
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Indicador de coordenadas */}
        <View style={[styles.coordsCard, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Coordenadas seleccionadas:
          </ThemedText>
          <ThemedText type="small" style={styles.coordsValue}>
            {selectedCoordinate
              ? `Lat: ${selectedCoordinate.latitude.toFixed(6)}, Lon: ${selectedCoordinate.longitude.toFixed(6)}`
              : 'Toca en el mapa o pulsa una parada de autobús'}
          </ThemedText>
        </View>

        {/* Selector de Prioridad */}
        <View style={styles.field}>
          <ThemedText type="smallBold">Prioridad</ThemedText>
          <View style={styles.prioritySelector}>
            {PRIORITIES.map((item) => {
              const isSelected = prioridad === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.priorityOption,
                    { borderColor: theme.backgroundSelected },
                    isSelected && {
                      backgroundColor: item.color,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => setPrioridad(item.value)}>
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.priorityText,
                      isSelected && styles.priorityTextActive,
                    ]}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Título *</ThemedText>
          <TextInput
            accessibilityLabel="Título de la incidencia"
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Marquesina rota o banco deteriorado"
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
            returnKeyType="next"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {titulo.length}/100
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Descripción *</ThemedText>
          <TextInput
            accessibilityLabel="Descripción de la incidencia"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Indica qué ocurre, elementos afectados y detalles relevantes."
            placeholderTextColor={theme.textSecondary}
            maxLength={400}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,
              { color: theme.text, borderColor: theme.backgroundSelected },
            ]}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {descripcion.length}/400
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Categoría (opcional)</ThemedText>
          <TextInput
            accessibilityLabel="Categoría de la incidencia"
            value={categoria}
            onChangeText={setCategoria}
            placeholder="Ej. Transporte, alumbrado, mobiliario..."
            placeholderTextColor={theme.textSecondary}
            maxLength={50}
            returnKeyType="done"
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
        </View>

        {error ? (
          <ThemedView style={styles.errorBox}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            disabled={saving}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">Cancelar</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={saving}
            style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" style={styles.submitButtonText}>
                Registrar incidencia
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  form: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  mapContainer: {
    height: 300,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  assetsLoadingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  assetsLoadingText: {
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '500',
  },
  locationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Brand.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  selectedAssetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: '#93c5fd',
    gap: Spacing.two,
  },
  selectedAssetInfo: {
    flex: 1,
    gap: 2,
  },
  selectedAssetBadge: {
    color: '#1d4ed8',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  deselectButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deselectButtonText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  coordsCard: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: 2,
  },
  coordsValue: {
    fontWeight: '500',
  },
  field: {
    gap: Spacing.one,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  priorityText: {
    fontSize: 13,
  },
  priorityTextActive: {
    color: '#ffffff',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  descriptionInput: {
    minHeight: 110,
  },
  errorBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#b91c1c',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  cancelButton: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  submitButton: {
    minHeight: 46,
    minWidth: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: Brand.orange,
  },
  submitButtonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.75,
  },
});
