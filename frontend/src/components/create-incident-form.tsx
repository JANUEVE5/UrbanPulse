import React, { useRef, useState } from 'react';
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
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createIncident } from '@/services/incidentService';

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
];

export function CreateIncidentForm({ onCancel, onCreated }: CreateIncidentFormProps) {
  const theme = useTheme();
  const mapRef = useRef<any>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [selectedCoordinate, setSelectedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState(INITIAL_REGION);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Manejador al tocar en el mapa
  const handleMapPress = (event: any) => {
    const coordinate = event?.nativeEvent?.coordinate;
    if (coordinate) {
      setSelectedCoordinate(coordinate);
    }
  };

  // Geolocalización con expo-location
  const handleGetCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const msg = 'Se requiere permiso de ubicación para situar la incidencia en tu posición.';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Permiso denegado', msg);
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
      mapRef.current?.animateToRegion?.(targetRegion);
    } catch (err) {
      console.error('Error al obtener la posición actual:', err);
      const msg = 'No se pudo obtener la ubicación actual del dispositivo.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
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

    setSaving(true);
    setError(null);
    try {
      await createIncident({
        titulo: cleanTitle,
        descripcion: cleanDescription,
        ...(categoria.trim() ? { categoria: categoria.trim() } : {}),
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
          Selecciona la ubicación en el mapa (OpenStreetMap con Leaflet) y completa los datos.
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.form}>
        {/* Mapa Leaflet (Web) / react-native-maps (Nativo) */}
        <View style={styles.mapContainer}>
          <IncidentMapView
            mapRef={mapRef}
            initialRegion={INITIAL_REGION}
            region={region}
            onPress={handleMapPress}
            selectedCoordinate={selectedCoordinate}
          />

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

        {/* Indicador de coordenadas */}
        <View style={[styles.coordsCard, { borderColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Coordenadas en el mapa:
          </ThemedText>
          <ThemedText type="small" style={styles.coordsValue}>
            {selectedCoordinate
              ? `Lat: ${selectedCoordinate.latitude.toFixed(6)}, Lon: ${selectedCoordinate.longitude.toFixed(6)}`
              : 'Toca en el mapa para marcar la ubicación'}
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
            placeholder="Ej. Farola apagada en acera"
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
            placeholder="Ej. Alumbrado, mobiliario, residuos..."
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
    height: 280,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  locationButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#2563eb',
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
    backgroundColor: '#16a34a',
  },
  submitButtonText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.75,
  },
});
