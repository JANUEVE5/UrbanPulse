/**
 * Tokens visuales de UrbanPulse (modo claro y oscuro).
 * - primary: azul mar, color de marca y de los elementos activos.
 * - signal: naranja señal, reservado para las incidencias en el mapa.
 * - border: líneas y separadores.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B2733',
    background: '#FFFFFF',
    backgroundElement: '#F3F6F8',
    backgroundSelected: '#E2EDF4',
    textSecondary: '#5B6875',
    border: '#DCE3E8',
    primary: '#0E5A8A',
    onPrimary: '#FFFFFF',
    signal: '#E8590C',
    scrim: 'rgba(27, 39, 51, 0.45)',
  },
  dark: {
    text: '#E8EEF2',
    background: '#0F1A22',
    backgroundElement: '#172632',
    backgroundSelected: '#1F3A4D',
    textSecondary: '#9AA9B5',
    border: '#26394A',
    primary: '#5BB0E6',
    onPrimary: '#0F1A22',
    signal: '#FF7A33',
    scrim: 'rgba(0, 0, 0, 0.55)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
