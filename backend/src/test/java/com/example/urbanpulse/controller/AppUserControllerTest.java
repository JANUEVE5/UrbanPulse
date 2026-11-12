package com.example.urbanpulse.controller;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.repository.AppUserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** El listado de usuarios solo es accesible para administración (RF02). */
@WebMvcTest(AppUserController.class)
@Import(SecurityConfig.class)
class AppUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @Test
    @DisplayName("Sin token: 401")
    void anonymousIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Ciudadano: 403")
    void citizenIsForbidden() throws Exception {
        mockMvc.perform(get("/api/users").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CITIZEN"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Administrador: 200 y sin contraseñas en la respuesta")
    void adminCanListUsers() throws Exception {
        AppUser admin = new AppUser(1, "Carlos Morales", "carlos@urbanpulse.es", "$2a$10$hash");
        admin.setRol(Rol.ADMIN);
        when(appUserRepository.findAll()).thenReturn(List.of(admin));

        mockMvc.perform(get("/api/users").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].rol").value("ADMIN"))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }
}
