/**
 * Almacenamiento del token de sesión en web: localStorage del navegador.
 * Puede no estar disponible (modo privado, almacenamiento bloqueado): entonces la sesión dura lo que la pestaña.
 */

const KEY = 'urbanpulse.auth.token';

export async function loadToken(): Promise<string | null> {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    // Sin almacenamiento disponible: la sesión no sobrevivirá a recargar la página
  }
}

export async function clearToken(): Promise<void> {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nada que borrar
  }
}
