import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ROLE_LABELS } from '@/constants/roles';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

interface NavItem {
  label: string;
  href: '/incidents';
}

/** Secciones disponibles hoy. */
const NAV_ITEMS: NavItem[] = [{ label: 'Incidencias', href: '/incidents' }];


interface SidebarProps {
  /** Se llama al elegir una sección (en móvil, para cerrar el panel). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, logout } = useAuth();

  const go = (href: '/login' | '/register') => {
    router.push(href);
    onNavigate?.();
  };

  // Secciones previstas (aún sin contenido): Perfil con sesión iniciada y Administración solo para ADMIN (RF02)
  const upcomingItems = [
    ...(status === 'signedIn' ? ['Perfil'] : []),
    'Ajustes',
    ...(user?.rol === 'ADMIN' ? ['Administración'] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/logo.webp')}
          style={styles.brandLogo}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
        <ThemedText style={styles.brandName}>UrbanPulse</ThemedText>
      </View>

      <View style={styles.section} accessibilityRole="menu">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Pressable
                key={item.href}
                onPress={() => {
                  router.push(item.href);
                  onNavigate?.();
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                style={({ pressed, hovered }) => [
                  styles.item,
                  active && { backgroundColor: theme.backgroundSelected },
                  !active && (hovered || pressed) && { backgroundColor: theme.backgroundElement },
                ]}>
                <View style={[styles.itemIndicator, active && { backgroundColor: theme.primary }]} />
                <ThemedText
                  style={[styles.itemLabel, active && { color: theme.primary, fontWeight: '700' }]}>
                  {item.label}
                </ThemedText>
              </Pressable>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
          Próximamente
        </ThemedText>
        {upcomingItems.map((label) => (
          <View key={label} style={styles.item} accessibilityState={{ disabled: true }}>
            <View style={styles.itemIndicator} />
            <ThemedText themeColor="textSecondary" style={[styles.itemLabel, styles.itemDisabled]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Sesión: abajo del todo */}
      <View style={[styles.account, { borderTopColor: theme.border }]}>
        {status === 'signedIn' && user ? (
          <>
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.avatarText}>{initials(user.nombre)}</ThemedText>
              </View>
              <View style={styles.userText}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {user.nombre}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {ROLE_LABELS[user.rol]}
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => {
                void logout();
                onNavigate?.();
              }}
              accessibilityRole="button"
              style={({ pressed, hovered }) => [
                styles.secondaryButton,
                { borderColor: theme.border },
                (hovered || pressed) && { backgroundColor: theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold">Cerrar sesión</ThemedText>
            </Pressable>
          </>
        ) : status === 'signedOut' ? (
          <>
            <Pressable
              onPress={() => go('/login')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.8 }]}>
              <ThemedText type="smallBold" style={{ color: Brand.white }}>
                Iniciar sesión
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => go('/register')} accessibilityRole="link" style={styles.linkButton}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Crear cuenta
              </ThemedText>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

/** Iniciales para el avatar: "Lucía Navarro" → "LN". */
function initials(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandName: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  section: {
    gap: Spacing.half,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderRadius: 8,
    paddingRight: Spacing.two,
  },
  itemIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
    marginRight: Spacing.two,
    marginLeft: Spacing.one,
  },
  itemLabel: {
    fontSize: 15,
    lineHeight: 20,
  },
  itemDisabled: {
    opacity: 0.7,
  },
  account: {
    marginTop: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '700',
  },
  userText: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.two,
  },
});
