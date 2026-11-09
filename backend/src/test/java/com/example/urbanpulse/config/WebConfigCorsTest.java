package com.example.urbanpulse.config;

import com.example.urbanpulse.controller.IncidentController;
import com.example.urbanpulse.service.IncidentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Comprueba que CORS se configura desde la propiedad app.cors.allowed-origins (CORS_ALLOWED_ORIGINS). */
@WebMvcTest(IncidentController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = "app.cors.allowed-origins=http://localhost:8081,https://app.urbanpulse.example")
class WebConfigCorsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IncidentService incidentService;

    @Test
    @DisplayName("Un origen permitido recibe la cabecera Access-Control-Allow-Origin")
    void allowedOriginIsAccepted() throws Exception {
        mockMvc.perform(options("/api/incidents")
                        .header(HttpHeaders.ORIGIN, "https://app.urbanpulse.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "https://app.urbanpulse.example"));
    }

    @Test
    @DisplayName("Un origen no configurado se rechaza")
    void unknownOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/incidents")
                        .header(HttpHeaders.ORIGIN, "https://otro-sitio.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
