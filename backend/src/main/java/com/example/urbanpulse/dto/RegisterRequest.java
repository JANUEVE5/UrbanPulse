package com.example.urbanpulse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cuerpo de {@code POST /api/auth/register}. El registro público siempre crea ciudadanos;
 * los demás roles los asigna un administrador.
 */
public record RegisterRequest(
        @NotBlank @Size(max = 100) String nombre,
        @NotBlank @Email @Size(max = 150) String correo,
        // BCrypt solo usa los primeros 72 bytes de la contraseña
        @NotBlank @Size(min = 8, max = 72) String contrasena
) {
}
