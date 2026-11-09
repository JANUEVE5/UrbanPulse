import { apiRequest } from '@/services/apiClient';

/** Roles de UrbanPulse (igual que en el backend, entity/Rol.java). */
export type Rol = 'CITIZEN' | 'OPERATOR' | 'TECHNICIAN' | 'ADMIN' | 'ANALYST';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
}

export interface AuthResponse {
  token: string;
  tipo: 'Bearer';
  expiraEn: string;
  usuario: User;
}

export interface LoginInput {
  correo: string;
  contrasena: string;
}

export interface RegisterInput extends LoginInput {
  nombre: string;
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: input,
    errorMessages: { 401: 'Correo o contraseña incorrectos.' },
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: input,
    errorMessages: {
      400: 'Revisa los datos: el correo debe ser válido y la contraseña tener al menos 8 caracteres.',
      409: 'Ya existe una cuenta con ese correo.',
    },
  });
}

/** Usuario del token actual (sirve para comprobar que la sesión guardada sigue siendo válida). */
export function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}
