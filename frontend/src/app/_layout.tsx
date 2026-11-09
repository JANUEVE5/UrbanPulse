import { DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppShell } from '@/components/app-shell';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <AppShell>
          <Slot />
        </AppShell>
      </AuthProvider>
    </ThemeProvider>
  );
}
