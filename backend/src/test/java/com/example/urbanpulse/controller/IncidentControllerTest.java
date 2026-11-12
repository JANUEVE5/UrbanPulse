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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
                                          "categoria": "Vía pública",
                                          "prioridad": "Alta"
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

    @Test
    @DisplayName("PATCH /api/incidents/{id}/status debe devolver el estado actualizado y su historial")
    void testUpdateIncidentStatus() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(1);
        dto.setEstado("En revisión");
        dto.setHistorial(List.of(new StatusChangeDTO(
                2, 1, "Ana García", "Abierta → En revisión", "Asignada para revisión", LocalDateTime.now()
        )));

        when(incidentService.updateIncidentStatus(
                org.mockito.ArgumentMatchers.eq(1),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(dto);

        mockMvc.perform(patch("/api/incidents/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "estado": "En revisión",
                                  "motivo": "Asignada para revisión"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("En revisión"))
                .andExpect(jsonPath("$.historial[0].transicion").value("Abierta → En revisión"));
    }

    @Test
    @DisplayName("PATCH /api/incidents/{id}/status debe rechazar un estado vacío")
    void testUpdateIncidentStatusWithBlankStatus() throws Exception {
        mockMvc.perform(patch("/api/incidents/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "estado": " "
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/incidents/{id}/priority debe actualizar la prioridad")
    void testUpdateIncidentPriority() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(1);
        dto.setPrioridad("Alta");
        when(incidentService.updateIncidentPriority(
                org.mockito.ArgumentMatchers.eq(1),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(dto);

        mockMvc.perform(patch("/api/incidents/1/priority")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "prioridad": "Alta"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prioridad").value("Alta"));
    }

    @Test
    @DisplayName("PATCH /api/incidents/{id}/priority debe rechazar prioridades desconocidas")
    void testUpdateIncidentPriorityRejectsUnknownValue() throws Exception {
        mockMvc.perform(patch("/api/incidents/1/priority")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "prioridad": "Crítica"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/incidents/{id}/comments debe añadir un comentario")
    void testCreateIncidentComment() throws Exception {
        IncidentDTO dto = new IncidentDTO();
        dto.setId(1);
        when(incidentService.createIncidentComment(
                org.mockito.ArgumentMatchers.eq(1),
                org.mockito.ArgumentMatchers.any()
        )).thenReturn(dto);

        mockMvc.perform(post("/api/incidents/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contenido": "Ya se avisó al equipo."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /api/incidents/{id}/comments debe rechazar comentarios vacíos")
    void testCreateIncidentCommentRejectsBlankContent() throws Exception {
        mockMvc.perform(post("/api/incidents/1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contenido": " "
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
