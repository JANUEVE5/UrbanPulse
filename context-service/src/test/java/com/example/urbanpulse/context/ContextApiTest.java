package com.example.urbanpulse.context;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ContextApiTest {
    private final ContextQueryService queryService = mock(ContextQueryService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ContextController(queryService)).build();

    @Test
    void exposesTheNormalizedContextResource() throws Exception {
        BigDecimal lat = new BigDecimal("36.72");
        BigDecimal lon = new BigDecimal("-4.42");
        when(queryService.getContext(lat, lon)).thenReturn(new ContextQueryService.ContextResponse(
                lat, lon, List.of(), null, List.of(), "CLOSED", "CLOSED", true, LocalDateTime.now()));
        mockMvc.perform(get("/api/context").param("lat", "36.72").param("lon", "-4.42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lat").value(36.72))
                .andExpect(jsonPath("$.activosCercanos").isArray())
                .andExpect(jsonPath("$.prediccion").isArray())
                .andExpect(jsonPath("$.degradado").value(true));
    }
}
