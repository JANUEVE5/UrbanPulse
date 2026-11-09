import type { Rol } from '@/services/authService';

/** Nombre de cada rol tal y como se muestra al usuario. */
export const ROLE_LABELS: Record<Rol, string> = {
  CITIZEN: 'Ciudadanía',
  OPERATOR: 'Operador municipal',
  TECHNICIAN: 'Técnico',
  ADMIN: 'Administración',
  ANALYST: 'Analista',
};
