/**
 * Tokens visuales de UrbanPulse, tomados del logo. La app usa solo tema claro: el logo es mitad azul
 * y no se distingue sobre fondos oscuros, y el mapa ya es claro.
 * - primary: azul del logo, color de marca y de los elementos activos.
 * - signal: naranja del logo, para las incidencias en el mapa y la acción principal (crear).
 * - border: líneas y separadores.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#1B2733',
  background: '#FFFFFF',
  backgroundElement: '#F3F6F8',
  backgroundSelected: '#E3ECF5',
  textSecondary: '#5B6875',
  border: '#DCE3E8',
  primary: '#104F85',
  onPrimary: '#FFFFFF',
  signal: '#F5841B',
  scrim: 'rgba(27, 39, 51, 0.45)',
} as const;

/** Colores del logo (botones y marcadores sobre el mapa). */
export const Brand = {
  blue: '#104F85',
  orange: '#F5841B',
  white: '#FFFFFF',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

/** A partir de este ancho la barra lateral se muestra fija; por debajo, se despliega con el botón de menú. */
export const WideLayoutMinWidth = 900;
export const SidebarWidth = 248;
/** Espacio que deja libre el botón flotante de menú (arriba a la izquierda) en pantallas estrechas. */
export const FloatingMenuInset = 64;
