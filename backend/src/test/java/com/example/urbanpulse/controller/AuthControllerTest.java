package com.example.urbanpulse.controller;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.dto.AuthResponse;
import com.example.urbanpulse.dto.LoginRequest;
import com.example.urbanpulse.dto.RegisterRequest;
import com.example.urbanpulse.dto.UserDTO;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    private static final UserDTO LUCIA = new UserDTO(2, "Lucía Navarro", "lucia@urbanpulse.es", Rol.OPERATOR);

    @Test
    @DisplayName("POST /api/auth/login es público y devuelve el token y el usuario")
    void loginReturnsToken() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenReturn(AuthResponse.bearer("token-de-prueba", Instant.parse("2026-11-08T12:00:00Z"), LUCIA));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "correo": "lucia@urbanpulse.es", "contrasena": "urbanpulse-dev" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-de-prueba"))
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.usuario.rol").value("OPERATOR"))
                .andExpect(jsonPath("$.usuario.contrasena").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login con credenciales incorrectas devuelve 401")
    void loginWithBadCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "correo": "lucia@urbanpulse.es", "contrasena": "mala" }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login valida el cuerpo (400 si falta el correo)")
    void loginValidatesBody() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "contrasena": "urbanpulse-dev" }
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(authService);
    }

    @Test
    @DisplayName("POST /api/auth/register es público y devuelve 201")
    void registerCreatesCitizen() throws Exception {
        UserDTO nuevo = new UserDTO(11, "Ana Pérez", "ana@example.com", Rol.CITIZEN);
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(AuthResponse.bearer("token-nuevo", Instant.parse("2026-11-08T12:00:00Z"), nuevo));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nombre": "Ana Pérez", "correo": "ana@example.com", "contrasena": "segura-123" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario.rol").value("CITIZEN"));
    }

    @Test
    @DisplayName("POST /api/auth/register rechaza contraseñas de menos de 8 caracteres")
    void registerRejectsShortPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nombre": "Ana", "correo": "ana@example.com", "contrasena": "corta" }
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(authService);
    }

    @Test
    @DisplayName("GET /api/auth/me sin token devuelve 401")
    void meRequiresToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me devuelve el usuario del token")
    void meReturnsCurrentUser() throws Exception {
        when(authService.currentUser(2)).thenReturn(LUCIA);

        mockMvc.perform(get("/api/auth/me")
                        .with(jwt().jwt(token -> token.subject("2").claim(SecurityConfig.ROLE_CLAIM, "OPERATOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value("lucia@urbanpulse.es"));
    }
}
