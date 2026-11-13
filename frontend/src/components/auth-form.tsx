import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, FloatingMenuInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useIsWideLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'login' | 'register';

/**
 * SOLO DESARROLLO: acceso rápido por rol. Se carga con require dentro de __DEV__ para que en producción
 * Metro elimine la rama y el módulo (con los usuarios de prueba) no llegue al código publicado;
 * un import normal lo incluiría aunque no se mostrara.
 */
const DevQuickLogin: typeof import('@/components/dev-quick-login').DevQuickLogin | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/components/dev-quick-login').DevQuickLogin
  : null;

/**
 * Formulario de inicio de sesión o de creación de cuenta (RF01).
 * Con ?destino=crear, al terminar abre directamente el formulario de nueva incidencia.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isWide = useIsWideLayout();
  const { login, register } = useAuth();
  const { destino } = useLocalSearchParams<{ destino?: string }>();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async () => {
    setError(null);
    if ((isRegister && !nombre.trim()) || !correo.trim() || !password) {
      setError('Rellena todos los campos.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    await authenticate(() =>
      isRegister
        ? register({ nombre: nombre.trim(), correo: correo.trim(), password })
        : login({ correo: correo.trim(), password }),
    );
  };

  /** Ejecuta el login o el registro y, si va bien, vuelve a incidencias (o abre el formulario de crear). */
  const authenticate = async (action: () => Promise<unknown>) => {
    setError(null);
    setSending(true);
    try {
      await action();
      router.replace(
        destino === 'crear' ? { pathname: '/incidents', params: { crear: '1' } } : '/incidents',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    } finally {
      setSending(false);
    }
  };

  const switchMode = () => {
    router.replace({
      pathname: isRegister ? '/login' : '/register',
      params: destino ? { destino } : {},
    });
  };

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border }];

  return (
    <ScrollView
      style={{ backgroundColor: theme.backgroundElement }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: (isWide ? Spacing.six : FloatingMenuInset + Spacing.four) + insets.top },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Image
          source={require('@/assets/images/logo.webp')}
          style={styles.logo}
          accessible={false}
        />
        <ThemedText style={styles.title}>{isRegister ? 'Crea tu cuenta' : 'Inicia sesión'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {isRegister
            ? 'Con una cuenta puedes registrar incidencias y seguir su estado.'
            : 'Accede para registrar incidencias y seguir su estado.'}
        </ThemedText>

        {isRegister && (
          <View style={styles.field}>
            <ThemedText type="smallBold">Nombre</ThemedText>
            <TextInput
              accessibilityLabel="Nombre"
              value={nombre}
              onChangeText={setNombre}
              autoComplete="name"
              maxLength={100}
              style={inputStyle}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        )}

        <View style={styles.field}>
          <ThemedText type="smallBold">Correo electrónico</ThemedText>
          <TextInput
            accessibilityLabel="Correo electrónico"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            maxLength={150}
            style={inputStyle}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Contraseña</ThemedText>
          <TextInput
            accessibilityLabel="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            maxLength={72}
            onSubmitEditing={handleSubmit}
            style={inputStyle}
            placeholderTextColor={theme.textSecondary}
          />
          {isRegister && (
            <ThemedText type="small" themeColor="textSecondary">
              Mínimo 8 caracteres.
            </ThemedText>
          )}
        </View>

        {error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={sending}
          accessibilityRole="button"
          style={({ pressed }) => [styles.submit, (pressed || sending) && styles.pressed]}>
          {sending ? (
            <ActivityIndicator color={Brand.white} />
          ) : (
            <ThemedText style={styles.submitText}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</ThemedText>
          )}
        </Pressable>

        <Pressable onPress={switchMode} accessibilityRole="link" style={styles.switch}>
          <ThemedText type="small" themeColor="textSecondary">
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {isRegister ? 'Inicia sesión' : 'Crea una'}
            </ThemedText>
          </ThemedText>
        </Pressable>

        {/* SOLO DESARROLLO: __DEV__ es false en las versiones publicadas, así que no se incluye */}
        {DevQuickLogin && !isRegister && (
          <DevQuickLogin
            disabled={sending}
            onLogin={(devCorreo, devPassword) =>
              void authenticate(() => login({ correo: devCorreo, password: devPassword }))
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  logo: {
    width: 56,
    height: 56,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  errorText: {
    color: '#B42318',
  },
  submit: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  submitText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  switch: {
    alignSelf: 'center',
    paddingVertical: Spacing.one,
  },
});
