import * as SecureStore from 'expo-secure-store';

/**
 * Almacenamiento del token de sesión en Android/iOS: almacén cifrado del sistema
 * (Keychain en iOS, Keystore en Android). La variante web está en token-storage.web.ts.
 */

const KEY = 'urbanpulse.auth.token';

export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
