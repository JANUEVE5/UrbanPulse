import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { urbanAssetType } from '@/constants/urban-assets';
import { useTheme } from '@/hooks/use-theme';
import type { UrbanAsset } from '@/services/urbanAssetService';

interface UrbanAssetPickerProps {
  assets: UrbanAsset[];
  loading: boolean;
  failed: boolean;
  selectedId: number | null;
  onSelect: (asset: UrbanAsset | null) => void;
  disabled?: boolean;
}

/**
 * Lista de activos urbanos cercanos para asociar a una incidencia (RF22), con la opción «Ninguno».
 * Muestra la distancia y la confianza de cada candidato; la elección es siempre de la persona.
 */
export function UrbanAssetPicker({ assets, loading, failed, selectedId, onSelect, disabled }: UrbanAssetPickerProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.status}>
        <ActivityIndicator size="small" color={theme.primary} />
        <ThemedText type="small" themeColor="textSecondary">
          Buscando elementos urbanos cercanos…
        </ThemedText>
      </View>
    );
  }
  if (failed) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No se han podido consultar los elementos cercanos. Puedes registrar la incidencia igualmente.
      </ThemedText>
    );
  }
  if (assets.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No hay elementos urbanos registrados a menos de 50 m de este punto.
      </ThemedText>
    );
  }

  const option = (key: string, selected: boolean, onPress: () => void, children: React.ReactNode) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { borderColor: selected ? theme.primary : theme.border },
        (selected || pressed) && { backgroundColor: theme.backgroundSelected },
      ]}>
      {children}
    </Pressable>
  );

  return (
    <View style={styles.list}>
      {option('ninguno', selectedId == null, () => onSelect(null), (
        <ThemedText type="smallBold">Ninguno</ThemedText>
      ))}
      {assets.map((asset) => {
        const type = urbanAssetType(asset.tipo);
        const detail = asset.direccion || asset.descripcion;
        return option(String(asset.id), selectedId === asset.id, () => onSelect(asset), (
          <View style={styles.optionBody}>
            <ThemedText style={styles.icon}>{type.icon}</ThemedText>
            <View style={styles.optionText}>
              <ThemedText type="smallBold">{type.label}</ThemedText>
              <ThemedText type="small" numberOfLines={1}>
                {asset.nombre}
              </ThemedText>
              {detail ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {detail}
                </ThemedText>
              ) : null}
            </View>
            {asset.distanciaMetros != null ? (
              <View style={styles.distance}>
                <ThemedText type="smallBold">{asset.distanciaMetros} m</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Confianza {asset.confianza?.toLowerCase()}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ));
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.one,
  },
  option: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  optionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    fontSize: 20,
    lineHeight: 26,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  distance: {
    alignItems: 'flex-end',
  },
});
