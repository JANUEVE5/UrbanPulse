package com.example.urbanpulse.controller;

import com.example.urbanpulse.dto.AuthResponse;
import com.example.urbanpulse.dto.LoginRequest;
import com.example.urbanpulse.dto.RegisterRequest;
import com.example.urbanpulse.dto.UserDTO;
import com.example.urbanpulse.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Registro, login y usuario actual (RF01). */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Crea una cuenta de ciudadano y devuelve su token (público). */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /** Inicia sesión y devuelve un token (público). */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Datos del usuario autenticado (requiere token). */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> me(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(authService.currentUser(Integer.valueOf(jwt.getSubject())));
    }
}
