import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NavItem {
  label: string;
  href: '/incidents';
}

/** Secciones disponibles hoy. */
const NAV_ITEMS: NavItem[] = [{ label: 'Incidencias', href: '/incidents' }];

/** Secciones previstas: se activarán con la gestión de usuarios y roles (RF01, RF02). */
const UPCOMING_ITEMS = ['Perfil', 'Ajustes', 'Administración'];

interface SidebarProps {
  /** Se llama al elegir una sección (en móvil, para cerrar el panel). */
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderRightColor: theme.border }]}>
      <View style={styles.brand}>
        <View style={[styles.brandMark, { backgroundColor: theme.primary }]}>
          <View style={[styles.brandPulse, { backgroundColor: theme.signal }]} />
        </View>
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
        {UPCOMING_ITEMS.map((label) => (
          <View key={label} style={styles.item} accessibilityState={{ disabled: true }}>
            <View style={styles.itemIndicator} />
            <ThemedText themeColor="textSecondary" style={[styles.itemLabel, styles.itemDisabled]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
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
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  brandPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.two,
  },
});
