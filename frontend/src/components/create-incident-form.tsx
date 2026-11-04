import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createIncident } from '@/services/incidentService';

interface CreateIncidentFormProps {
  onCancel: () => void;
  onCreated: () => Promise<void>;
}

export function CreateIncidentForm({ onCancel, onCreated }: CreateIncidentFormProps) {
  const theme = useTheme();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
          Describe el problema urbano para que pueda ser gestionado.
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.form}>
        <View style={styles.field}>
          <ThemedText type="smallBold">Título *</ThemedText>
          <TextInput
            accessibilityLabel="Título de la incidencia"
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej. Bache en la calzada"
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
            placeholder="Indica qué ocurre y dónde se encuentra."
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
            placeholder="Ej. Alumbrado, tráfico, limpieza..."
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
  field: {
    gap: Spacing.one,
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
    minHeight: 130,
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
