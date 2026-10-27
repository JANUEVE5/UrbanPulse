import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            UrbanPulse
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Gestión Inteligente de Incidencias Urbanas
          </ThemedText>
        </ThemedView>

        {/* Botón principal de Incidencias */}
        <Pressable
          style={({ pressed }) => [styles.incidentsButton, pressed && styles.pressed]}
          onPress={() => router.push('/incidents')}>
          <ThemedText type="subtitle" style={styles.incidentsButtonTitle}>
            📋 Incidencias
          </ThemedText>
          <ThemedText type="small" style={styles.incidentsButtonDescription}>
            Consultar el listado completo y ver el detalle de cada incidencia
          </ThemedText>
          <ThemedView style={styles.incidentsButtonAction}>
            <ThemedText type="smallBold" style={styles.actionText}>
              Explorar incidencias →
            </ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <ThemedText type="smallBold" style={styles.cardHeader}>
            ℹ️ Sistema UrbanPulse
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            • Consulta y gestión detallada de incidencias por identificador.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            • Trazabilidad y seguimiento de activos urbanos.
          </ThemedText>
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  incidentsButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    width: '100%',
    gap: Spacing.one,
    shadowColor: '#3c87f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  incidentsButtonTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  incidentsButtonDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  incidentsButtonAction: {
    marginTop: Spacing.two,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  actionText: {
    color: '#3c87f7',
  },
  stepContainer: {
    gap: Spacing.two,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardHeader: {
    fontSize: 14,
    color: '#3c87f7',
  },
});
