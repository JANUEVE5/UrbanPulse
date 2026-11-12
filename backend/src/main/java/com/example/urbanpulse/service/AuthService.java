package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.AuthResponse;
import com.example.urbanpulse.dto.LoginRequest;
import com.example.urbanpulse.dto.RegisterRequest;
import com.example.urbanpulse.dto.UserDTO;

/** Registro, login y consulta del usuario autenticado (RF01). */
public interface AuthService {

    /** Crea un ciudadano y devuelve su token. 409 si el correo ya existe. */
    AuthResponse register(RegisterRequest request);

    /** Comprueba las credenciales y devuelve un token. 401 si no son válidas. */
    AuthResponse login(LoginRequest request);

    /** Datos del usuario del token. 401 si ya no existe. */
    UserDTO currentUser(Integer userId);
}
