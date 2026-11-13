package com.example.urbanpulse.controller;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.dto.UrbanAssetDTO;
import com.example.urbanpulse.service.UrbanAssetService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UrbanAssetController.class)
@Import(SecurityConfig.class)
class UrbanAssetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UrbanAssetService urbanAssetService;

    @Test
    @DisplayName("GET /api/urban-assets/nearby devuelve los candidatos con distancia y confianza")
    void findNearby() throws Exception {
        UrbanAssetDTO parada = new UrbanAssetDTO();
        parada.setId(3);
        parada.setTipo("PARADA_AUTOBUS");
        parada.setNombre("Plaza de la Marina");
        parada.setDistanciaMetros(12);
        parada.setConfianza("Alta");
        when(urbanAssetService.findNearby(new BigDecimal("36.7187"), new BigDecimal("-4.4208"), 50))
                .thenReturn(List.of(parada));

        mockMvc.perform(get("/api/urban-assets/nearby")
                        .param("latitud", "36.7187").param("longitud", "-4.4208")
                        .with(citizenToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(3))
                .andExpect(jsonPath("$[0].tipo").value("PARADA_AUTOBUS"))
                .andExpect(jsonPath("$[0].distanciaMetros").value(12))
                .andExpect(jsonPath("$[0].confianza").value("Alta"));
    }

    @Test
    @DisplayName("GET /api/urban-assets/nearby exige autenticación")
    void findNearbyRequiresToken() throws Exception {
        mockMvc.perform(get("/api/urban-assets/nearby").param("latitud", "36.7").param("longitud", "-4.4"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/urban-assets/nearby rechaza un radio mayor de 200 m")
    void findNearbyRejectsLargeRadius() throws Exception {
        mockMvc.perform(get("/api/urban-assets/nearby")
                        .param("latitud", "36.7").param("longitud", "-4.4").param("radio", "5000")
                        .with(citizenToken()))
                .andExpect(status().isBadRequest());
        verify(urbanAssetService, never()).findNearby(eq(new BigDecimal("36.7")), eq(new BigDecimal("-4.4")), anyInt());
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor citizenToken() {
        return jwt().jwt(token -> token.subject("1").claim(SecurityConfig.ROLE_CLAIM, "CITIZEN"))
                .authorities(new SimpleGrantedAuthority("ROLE_CITIZEN"));
    }
}
