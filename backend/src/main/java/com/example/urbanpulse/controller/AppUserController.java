package com.example.urbanpulse.controller;

import com.example.urbanpulse.dto.UserDTO;
import com.example.urbanpulse.repository.AppUserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gestión de usuarios: solo administración (RF02). */
@RestController
@RequestMapping("/api/users")
public class AppUserController {

    private final AppUserRepository appUserRepository;

    public AppUserController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    /** Listado de usuarios con su rol (sin contraseñas). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> getAllUsers() {
        return appUserRepository.findAll().stream().map(UserDTO::fromEntity).toList();
    }
}
