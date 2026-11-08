package com.example.urbanpulse.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Cuerpo de {@code POST /api/auth/login}. */
public record LoginRequest(
        @NotBlank @Email String correo,
        @NotBlank String contrasena
) {
}
