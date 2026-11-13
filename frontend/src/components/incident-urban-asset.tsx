import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Coordinate } from '@/components/incident-map-view.types';
import { ThemedText } from '@/components/themed-text';
import { UrbanAssetPicker } from '@/components/urban-asset-picker';
import { Spacing } from '@/constants/theme';
import { urbanAssetType } from '@/constants/urban-assets';
import { useNearbyUrbanAssets } from '@/hooks/use-nearby-urban-assets';
import { useTheme } from '@/hooks/use-theme';
import { updateIncidentUrbanAsset, type Incident } from '@/services/incidentService';
import type { UrbanAsset } from '@/services/urbanAssetService';

interface IncidentUrbanAssetProps {
  incident: Incident;
  coordinate: Coordinate | null;
  /** Operador o administración: puede confirmar, cambiar o quitar el elemento (RF22). */
  canManage: boolean;
  onUpdated: (incident: Incident) => void;
}

/** Elemento urbano asociado a la incidencia, en el detalle. */
export function IncidentUrbanAsset({ incident, coordinate, canManage, onUpdated }: IncidentUrbanAssetProps) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UrbanAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nearby = useNearbyUrbanAssets(editing ? coordinate : null);
  const asset = incident.urbanAsset;

  const startEditing = () => {
    setDraft(asset ?? null);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      onUpdated(await updateIncidentUrbanAsset(incident.id, draft?.id ?? null));
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el elemento asociado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Elemento urbano afectado:
      </ThemedText>

      {asset ? (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.background }]}>
          <ThemedText style={styles.icon}>{urbanAssetType(asset.tipo).icon}</ThemedText>
          <View style={styles.cardText}>
            <ThemedText type="smallBold">{urbanAssetType(asset.tipo).label}</ThemedText>
            <ThemedText type="default">{asset.nombre}</ThemedText>
            {asset.direccion ? (
              <ThemedText type="small" themeColor="textSecondary">
                {asset.direccion}
              </ThemedText>
            ) : null}
            {asset.descripcion ? (
              <ThemedText type="small" themeColor="textSecondary">
                {asset.descripcion}
              </ThemedText>
            ) : null}
            <ThemedText type="small" themeColor="textSecondary">
              Fuente: datos abiertos del Ayuntamiento de Málaga
            </ThemedText>
          </View>
        </View>
      ) : (
        <ThemedText type="default">Ninguno</ThemedText>
      )}

      {canManage && coordinate && !editing ? (
        <Pressable
          accessibilityRole="button"
          onPress={startEditing}
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {asset ? 'Cambiar elemento asociado' : 'Asociar un elemento cercano'}
          </ThemedText>
        </Pressable>
      ) : null}

      {editing ? (
        <View style={styles.editor}>
          <UrbanAssetPicker
            assets={nearby.assets}
            loading={nearby.loading}
            failed={nearby.failed}
            selectedId={draft?.id ?? null}
            onSelect={setDraft}
            disabled={saving}
          />
          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEditing(false)}
              disabled={saving}
              style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border }, pressed && styles.pressed]}>
              <ThemedText type="smallBold">Cancelar</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={save}
              disabled={saving}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
              {saving ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                  Guardar
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
  },
  icon: {
    fontSize: 22,
    lineHeight: 28,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  linkButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  editor: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minWidth: 90,
    alignItems: 'center',
  },
  error: {
    color: '#B42318',
  },
  pressed: {
    opacity: 0.7,
  },
});
