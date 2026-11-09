import { Platform } from 'react-native';

/**
 * Cliente HTTP común de la app: URL base de la API, token de sesión y errores.
 * Todos los servicios (incidencias, autenticación…) pasan por aquí; nunca se hace fetch desde componentes.
 */

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api',
  default: 'http://localhost:8080/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

/** Error de la API con su código HTTP (0 si no se pudo conectar). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token de la sesión actual. Lo gestiona AuthProvider (context/auth-context.tsx).
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Se llama cuando el servidor rechaza el token (caducado o inválido) para cerrar la sesión. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Mensajes propios por código HTTP (por ejemplo, 409 en el registro). */
  errorMessages?: Partial<Record<number, string>>;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Revisa los datos: hay campos que no son válidos.',
  401: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para hacer esta operación.',
  404: 'No se ha encontrado el recurso solicitado.',
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, errorMessages = {} } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor (${API_BASE_URL}). Comprueba que el backend está en marcha.`,
    );
  }

  if (!response.ok) {
    // Un 401 con sesión iniciada significa que el token ya no vale: se cierra la sesión
    if (response.status === 401 && authToken) onUnauthorized?.();
    const message =
      errorMessages[response.status] ??
      DEFAULT_MESSAGES[response.status] ??
      `Error ${response.status} al comunicarse con el servidor.`;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
