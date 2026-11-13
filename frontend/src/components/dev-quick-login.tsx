import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ROLE_LABELS } from '@/constants/roles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Rol } from '@/services/authService';

/**
 * ⚠️ SOLO DESARROLLO. Acceso rápido con un usuario de prueba de cada rol para probar permisos sin
 * escribir credenciales. Son los usuarios de backend/src/main/resources/data.sql (contraseña de
 * desarrollo documentada en docs/development.md). AuthForm solo lo muestra si __DEV__ es true, así que
 * no aparece en las versiones publicadas de la app. Quitar cuando deje de hacer falta.
 */

export const DEV_PASSWORD = 'urbanpulse-dev';

const DEV_USERS: { rol: Rol; correo: string }[] = [
  { rol: 'CITIZEN', correo: 'david.serrano@urbanpulse.es' },
  { rol: 'OPERATOR', correo: 'lucia.navarro@urbanpulse.es' },
  { rol: 'TECHNICIAN', correo: 'marta.castillo@urbanpulse.es' },
  { rol: 'ANALYST', correo: 'elena.romero@urbanpulse.es' },
  { rol: 'ADMIN', correo: 'carlos.morales@urbanpulse.es' },
];

interface DevQuickLoginProps {
  onLogin: (correo: string, password: string) => void;
  disabled: boolean;
}

export function DevQuickLogin({ onLogin, disabled }: DevQuickLoginProps) {
  const theme = useTheme();

  return (
    <View style={[styles.box, { borderColor: theme.signal }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Acceso rápido para pruebas</ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.signal }]}>
          <ThemedText style={styles.badgeText}>Solo desarrollo</ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Entra con un usuario de prueba de cada rol. Contraseña de todos: {DEV_PASSWORD}
      </ThemedText>

      <View style={styles.list}>
        {DEV_USERS.map((user) => (
          <Pressable
            key={user.rol}
            disabled={disabled}
            onPress={() => onLogin(user.correo, DEV_PASSWORD)}
            accessibilityRole="button"
            accessibilityLabel={`Entrar como ${ROLE_LABELS[user.rol]}`}
            style={({ pressed, hovered }) => [
              styles.option,
              { borderColor: theme.border },
              (pressed || hovered) && { backgroundColor: theme.backgroundSelected },
              disabled && styles.disabled,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Entrar como {ROLE_LABELS[user.rol]}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {user.correo}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
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
  disabled: {
    opacity: 0.5,
  },
});
