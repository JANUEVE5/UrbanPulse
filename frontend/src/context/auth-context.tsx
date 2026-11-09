import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearToken, loadToken, saveToken } from '@/lib/token-storage';
import { setAuthToken, setUnauthorizedHandler } from '@/services/apiClient';
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type User,
} from '@/services/authService';

/**
 * Sesión del usuario (RF01).
 * - Al abrir la app recupera el token guardado y lo valida con /api/auth/me.
 * - login/register guardan el token; logout lo borra.
 * - Si la API rechaza el token (caducado), la sesión se cierra sola.
 */

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setStatus('signedOut');
    await clearToken();
  }, []);

  // Restaurar la sesión guardada
  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(() => void logout());

    void (async () => {
      const token = await loadToken();
      if (!token) {
        if (active) setStatus('signedOut');
        return;
      }
      setAuthToken(token);
      try {
        const current = await getCurrentUser();
        if (!active) return;
        setUser(current);
        setStatus('signedIn');
      } catch {
        // Token caducado o servidor no disponible: se empieza sin sesión
        if (active) await logout();
      }
    })();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const startSession = useCallback(async (response: AuthResponse) => {
    setAuthToken(response.token);
    await saveToken(response.token);
    setUser(response.usuario);
    setStatus('signedIn');
    return response.usuario;
  }, []);

  const login = useCallback(
    async (input: LoginInput) => startSession(await loginRequest(input)),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession(await registerRequest(input)),
    [startSession],
  );

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
