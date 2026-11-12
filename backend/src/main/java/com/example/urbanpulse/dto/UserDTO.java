package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Rol;

/** Datos públicos de un usuario: nunca incluye la contraseña. */
public record UserDTO(Integer id, String nombre, String correo, Rol rol) {

    public static UserDTO fromEntity(AppUser user) {
        return new UserDTO(user.getId(), user.getNombre(), user.getCorreo(), user.getRol());
    }
}
