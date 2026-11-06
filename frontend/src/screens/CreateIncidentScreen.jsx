import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';

import IncidentMapView from '../components/IncidentMapView';
import { IncidentService } from '../services/IncidentService';

// Coordenadas por defecto (Centro de Málaga)
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

export default function CreateIncidentScreen({ navigation, onSuccess }) {
  const mapRef = useRef(null);

  // Estados del formulario
  const [reporte, setReporte] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);

  // Estados de carga y mapa
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [region, setRegion] = useState(INITIAL_REGION);

  // 1. Interacción táctil: tocar el mapa para situar o mover el marcador
  const handleMapPress = (event) => {
    const coordinate = event?.nativeEvent?.coordinate;
    if (coordinate) {
      setSelectedCoordinate(coordinate);
    }
  };

  // 2. Geolocalización del dispositivo con expo-location
  const handleGetCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const msg = 'Se necesita permiso de ubicación para situar la incidencia en tu posición actual.';
        if (Platform.OS === 'web') {
          alert(msg);
        } else {
          Alert.alert('Permiso denegado', msg);
        }
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
      mapRef.current?.animateToRegion(targetRegion, 800);
    } catch (error) {
      console.error('Error al obtener la localización:', error);
      const msg = 'No se pudo obtener la ubicación actual del dispositivo.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsLocating(false);
    }
  };

  // 3. Envío al backend usando el servicio desacoplado
  const handleSubmit = async () => {
    if (!reporte.trim()) {
      const msg = 'Por favor, describe la incidencia a reportar.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Campo obligatorio', msg);
      return;
    }

    if (!selectedCoordinate) {
      const msg = 'Por favor, toca el mapa o pulsa el botón de mi ubicación para fijar las coordenadas.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Ubicación requerida', msg);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        reporte: reporte.trim(),
        prioridad,
        coordenadas: selectedCoordinate,
        localizacion: `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`,
      };

      await IncidentService.createIncident(payload);

      const finish = () => {
        setReporte('');
        setSelectedCoordinate(null);
        setPrioridad('Media');
        if (onSuccess) onSuccess();
        if (navigation?.goBack) navigation.goBack();
      };

      if (Platform.OS === 'web') {
        alert('Tu reporte ha sido registrado correctamente en UrbanPulse.');
        finish();
      } else {
        Alert.alert(
          'Incidencia creada',
          'Tu reporte ha sido registrado correctamente en UrbanPulse.',
          [{ text: 'Aceptar', onPress: finish }]
        );
      }
    } catch (error) {
      console.error('Error al registrar la incidencia:', error);
      const msg = error.message || 'No fue posible registrar la incidencia.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>Crear Incidencia</Text>
          <Text style={styles.subtitle}>
            Selecciona la ubicación en el mapa de OpenStreetMap y describe el problema.
          </Text>
        </View>

        {/* Mapa con OSM (Nativo con react-native-maps en Android/iOS, Web con OSM en navegador) */}
        <View style={styles.mapContainer}>
          <IncidentMapView
            mapRef={mapRef}
            initialRegion={INITIAL_REGION}
            region={region}
            onPress={handleMapPress}
            selectedCoordinate={selectedCoordinate}
          />

          {/* Botón flotante para geolocalización actual */}
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
              <Text style={styles.locationButtonText}>📍 Mi ubicación</Text>
            )}
          </Pressable>
        </View>

        {/* Indicador de coordenadas seleccionadas */}
        <View style={styles.coordsCard}>
          <Text style={styles.coordsLabel}>Coordenadas seleccionadas:</Text>
          <Text style={styles.coordsValue}>
            {selectedCoordinate
              ? `${selectedCoordinate.latitude.toFixed(6)}, ${selectedCoordinate.longitude.toFixed(6)}`
              : 'Toca sobre el mapa para fijar la ubicación'}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Selector de Prioridad */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Prioridad:</Text>
            <View style={styles.prioritySelector}>
              {PRIORITIES.map((item) => {
                const isSelected = prioridad === item.value;
                return (
                  <Pressable
                    key={item.value}
                    style={[
                      styles.priorityOption,
                      isSelected && {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => setPrioridad(item.value)}>
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && styles.priorityTextActive,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Campo de Reporte / Descripción */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Descripción del reporte *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ej. Farola fundida frente al número 12, cables a la vista..."
              placeholderTextColor="#9ca3af"
              value={reporte}
              onChangeText={setReporte}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={400}
            />
            <Text style={styles.charCount}>{reporte.length}/400</Text>
          </View>

          {/* Botón de Enviar */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressed,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Registrar Incidencia</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  coordsCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  coordsValue: {
    fontSize: 14,
    color: '#0f172a',
    marginTop: 2,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  priorityTextActive: {
    color: '#ffffff',
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
