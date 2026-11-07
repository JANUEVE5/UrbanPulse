import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sidebar } from '@/components/sidebar';
import { SidebarWidth, Spacing } from '@/constants/theme';
import { useIsWideLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

/**
 * Estructura común de la app:
 * - Pantalla ancha: barra lateral fija a la izquierda y el contenido a la derecha.
 * - Pantalla estrecha (móvil): contenido a pantalla completa, botón de menú flotante arriba a la izquierda
 *   y barra lateral que se despliega por encima.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const isWide = useIsWideLayout();
  const theme = useTheme();

  if (isWide) {
    return (
      <View style={[styles.row, { backgroundColor: theme.background }]}>
        <View style={{ width: SidebarWidth }}>
          <Sidebar />
        </View>
        <View style={styles.main}>{children}</View>
      </View>
    );
  }

  return <NarrowShell>{children}</NarrowShell>;
}

function NarrowShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Se crea una sola vez; useState evita leer refs durante el render
  const [progress] = useState(() => new Animated.Value(0));

  // Muestra/oculta el panel con un deslizamiento corto (sin animación si el sistema pide reducir movimiento)
  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (open) setMounted(true);
      Animated.timing(progress, {
        toValue: open ? 1 : 0,
        duration: reduceMotion ? 0 : 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !open && !cancelled) setMounted(false);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-SidebarWidth, 0] });

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <View style={styles.main}>{children}</View>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
        hitSlop={8}
        style={({ pressed }) => [
          styles.menuButton,
          {
            top: insets.top + Spacing.three,
            backgroundColor: theme.background,
            borderColor: theme.border,
          },
          pressed && styles.pressed,
        ]}>
        {[0, 1, 2].map((bar) => (
          <View key={bar} style={[styles.menuBar, { backgroundColor: theme.text }]} />
        ))}
      </Pressable>

      {mounted && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]}
              onPress={() => setOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              { paddingTop: insets.top, backgroundColor: theme.background, transform: [{ translateX }] },
            ]}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  fill: {
    flex: 1,
  },
  main: {
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    left: Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SidebarWidth,
  },
});
