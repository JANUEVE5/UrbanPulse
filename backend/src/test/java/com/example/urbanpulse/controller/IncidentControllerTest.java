package com.example.urbanpulse.controller;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.StatusChangeDTO;
import com.example.urbanpulse.service.IncidentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IncidentController.class)
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IncidentService incidentService;

    @Test
    @DisplayName("GET /api/incidents debe retornar 200 OK con la lista de incidencias")
    void testGetAllIncidents() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(1);
        dto.setReporteCentral("El semáforo no funciona.");
        dto.setLocalizacion("Plaza Mayor");
        dto.setEstado("Abierta");
        dto.setPrioridad("Alta");
        dto.setUrbanAssetId(1);
        dto.setUrbanAssetTipo("Semáforo");
        dto.setIdCreador(1);
        dto.setNombreCreador("Ana García");
        dto.setCreatedAt(LocalDateTime.now());

        when(incidentService.getAllIncidents()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].reporteCentral").value("El semáforo no funciona."))
                .andExpect(jsonPath("$[0].localizacion").value("Plaza Mayor"))
                .andExpect(jsonPath("$[0].estado").value("Abierta"))
                .andExpect(jsonPath("$[0].prioridad").value("Alta"))
                .andExpect(jsonPath("$[0].urbanAssetTipo").value("Semáforo"))
                .andExpect(jsonPath("$[0].nombreCreador").value("Ana García"));
    }

    @Test
    @DisplayName("GET /api/incidents/{id} debe retornar 200 OK con el detalle de la incidencia")
    void testGetIncidentByIdFound() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(1);
        dto.setReporteCentral("El semáforo no funciona.");
        dto.setLocalizacion("Plaza Mayor");
        dto.setEstado("Abierta");
        dto.setPrioridad("Alta");
        dto.setUrbanAssetId(1);
        dto.setUrbanAssetTipo("Semáforo");
        dto.setIdCreador(1);
        dto.setNombreCreador("Ana García");
        dto.setCreatedAt(LocalDateTime.now());

        StatusChangeDTO sc = new StatusChangeDTO(1, 2, "Luis Pérez", "Abierta → En revisión", "Incidencia asignada para revisión", LocalDateTime.now());
        dto.setHistorial(List.of(sc));

        when(incidentService.getIncidentById(1)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/incidents/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.reporteCentral").value("El semáforo no funciona."))
                .andExpect(jsonPath("$.localizacion").value("Plaza Mayor"))
                .andExpect(jsonPath("$.historial[0].transicion").value("Abierta → En revisión"));
    }

    @Test
    @DisplayName("GET /api/incidents/{id} debe retornar 404 Not Found si no existe la incidencia")
    void testGetIncidentByIdNotFound() throws Exception {
        when(incidentService.getIncidentById(99)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/incidents/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/incidents debe crear una incidencia")
    void testCreateIncident() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(2);
        dto.setTitulo("Bache en la calzada");
        dto.setDescripcion("Hay un bache frente al número 12.");
        dto.setCategoria("Vía pública");
        dto.setReporteCentral("Hay un bache frente al número 12.");

        when(incidentService.createIncident(org.mockito.ArgumentMatchers.any(CreateIncidentRequest.class)))
                .thenReturn(dto);

        mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": "Bache en la calzada",
                                  "descripcion": "Hay un bache frente al número 12.",
                                  "categoria": "Vía pública"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.titulo").value("Bache en la calzada"))
                .andExpect(jsonPath("$.descripcion").value("Hay un bache frente al número 12."))
                .andExpect(jsonPath("$.categoria").value("Vía pública"));
    }

    @Test
    @DisplayName("POST /api/incidents debe rechazar título vacío")
    void testCreateIncidentWithBlankTitle() throws Exception {
        mockMvc.perform(post("/api/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": " ",
                                  "descripcion": "Hay un bache."
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
