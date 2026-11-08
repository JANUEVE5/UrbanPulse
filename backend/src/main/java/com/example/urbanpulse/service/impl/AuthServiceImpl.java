package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.AuthResponse;
import com.example.urbanpulse.dto.LoginRequest;
import com.example.urbanpulse.dto.RegisterRequest;
import com.example.urbanpulse.dto.UserDTO;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.service.AuthService;
import com.example.urbanpulse.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    /** Mismo mensaje para correo inexistente y contraseña errónea: no revela qué correos están registrados. */
    private static final String INVALID_CREDENTIALS = "Correo o contraseña incorrectos.";

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthServiceImpl(AppUserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           TokenService tokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String correo = normalizeEmail(request.correo());
        if (userRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo.");
        }

        AppUser user = new AppUser(request.nombre().trim(), correo, passwordEncoder.encode(request.contrasena()));
        // El registro público solo crea ciudadanos; los demás roles los asigna administración
        user.setRol(Rol.CITIZEN);
        return toAuthResponse(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        AppUser user = userRepository.findByCorreoIgnoreCase(normalizeEmail(request.correo()))
                .filter(u -> passwordEncoder.matches(request.contrasena(), u.getContrasena()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS));
        return toAuthResponse(user);
    }

    @Override
    public UserDTO currentUser(Integer userId) {
        return userRepository.findById(userId)
                .map(UserDTO::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "El usuario ya no existe."));
    }

    private AuthResponse toAuthResponse(AppUser user) {
        TokenService.IssuedToken token = tokenService.issue(user);
        return AuthResponse.bearer(token.value(), token.expiresAt(), UserDTO.fromEntity(user));
    }

    private static String normalizeEmail(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
