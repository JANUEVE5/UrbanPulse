package com.example.urbanpulse.entity;

/**
 * Roles de UrbanPulse (RF02, ADR-009). Se guardan como texto en la columna {@code "User".rol}
 * y viajan en el JWT en la reclamación {@code rol}; Spring Security los usa como {@code ROLE_<rol>}.
 */
public enum Rol {
    /** Registra incidencias y consulta las suyas. Rol por defecto al registrarse. */
    CITIZEN,
    /** Valida, rechaza, prioriza y asigna incidencias. */
    OPERATOR,
    /** Atiende las incidencias asignadas y documenta su resolución. */
    TECHNICIAN,
    /** Gestiona usuarios, roles, categorías y fuentes. */
    ADMIN,
    /** Consulta indicadores y análisis. */
    ANALYST
}
