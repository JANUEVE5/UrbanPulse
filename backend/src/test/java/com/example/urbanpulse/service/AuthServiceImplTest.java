package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.AuthResponse;
import com.example.urbanpulse.dto.LoginRequest;
import com.example.urbanpulse.dto.RegisterRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private TokenService tokenService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4); // coste bajo: tests rápidos

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userRepository, passwordEncoder, tokenService);
    }

    private AppUser user(String rawPassword, Rol rol) {
        AppUser user = new AppUser(2, "Lucía Navarro", "lucia@urbanpulse.es", passwordEncoder.encode(rawPassword));
        user.setRol(rol);
        return user;
    }

    @Test
    @DisplayName("login con la contraseña correcta devuelve el token y el rol")
    void loginOk() {
        AppUser lucia = user("urbanpulse-dev", Rol.OPERATOR);
        when(userRepository.findByCorreoIgnoreCase("lucia@urbanpulse.es")).thenReturn(Optional.of(lucia));
        when(tokenService.issue(lucia)).thenReturn(new TokenService.IssuedToken("jwt", Instant.EPOCH));

        AuthResponse response = authService.login(new LoginRequest("  Lucia@UrbanPulse.es ", "urbanpulse-dev"));

        assertEquals("jwt", response.token());
        assertEquals(Rol.OPERATOR, response.usuario().rol());
    }

    @Test
    @DisplayName("login con contraseña incorrecta devuelve 401")
    void loginWrongPassword() {
        when(userRepository.findByCorreoIgnoreCase("lucia@urbanpulse.es"))
                .thenReturn(Optional.of(user("urbanpulse-dev", Rol.OPERATOR)));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("lucia@urbanpulse.es", "otra")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    @DisplayName("login con un correo inexistente devuelve 401 con el mismo mensaje")
    void loginUnknownEmail() {
        when(userRepository.findByCorreoIgnoreCase("nadie@urbanpulse.es")).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.login(new LoginRequest("nadie@urbanpulse.es", "x")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Correo o contraseña incorrectos.", ex.getReason());
    }

    @Test
    @DisplayName("register guarda la contraseña cifrada con BCrypt y el rol CITIZEN")
    void registerCreatesCitizenWithHashedPassword() {
        when(userRepository.existsByCorreoIgnoreCase("ana@example.com")).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenService.issue(any(AppUser.class))).thenReturn(new TokenService.IssuedToken("jwt", Instant.EPOCH));

        authService.register(new RegisterRequest(" Ana Pérez ", "Ana@Example.com", "segura-123"));

        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(saved.capture());
        assertEquals("ana@example.com", saved.getValue().getCorreo());
        assertEquals("Ana Pérez", saved.getValue().getNombre());
        assertEquals(Rol.CITIZEN, saved.getValue().getRol());
        assertNotEquals("segura-123", saved.getValue().getContrasena());
        assertTrue(passwordEncoder.matches("segura-123", saved.getValue().getContrasena()));
    }

    @Test
    @DisplayName("register con un correo ya registrado devuelve 409")
    void registerDuplicateEmail() {
        when(userRepository.existsByCorreoIgnoreCase("lucia@urbanpulse.es")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.register(new RegisterRequest("Lucía", "lucia@urbanpulse.es", "segura-123")));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        verify(userRepository, never()).save(any());
    }
}
