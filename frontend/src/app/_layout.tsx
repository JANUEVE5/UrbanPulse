import { DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppShell } from '@/components/app-shell';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <AppShell>
        <Slot />
      </AppShell>
    </ThemeProvider>
  );
}
