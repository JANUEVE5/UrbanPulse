package com.example.urbanpulse.dto;

import java.time.Instant;

/**
 * Respuesta de login y registro: el token JWT que el cliente debe enviar en la cabecera
 * {@code Authorization: Bearer <token>} y los datos del usuario autenticado.
 */
public record AuthResponse(String token, String tipo, Instant expiraEn, UserDTO usuario) {

    public static AuthResponse bearer(String token, Instant expiraEn, UserDTO usuario) {
        return new AuthResponse(token, "Bearer", expiraEn, usuario);
    }
}
