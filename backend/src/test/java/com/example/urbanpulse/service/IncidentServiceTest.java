package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.IncidentComment;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.entity.UrbanAsset;
import com.example.urbanpulse.repository.IncidentRepository;
import com.example.urbanpulse.repository.IncidentCommentRepository;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.repository.StatusChangeRepository;
import com.example.urbanpulse.service.impl.IncidentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private StatusChangeRepository statusChangeRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private IncidentCommentRepository incidentCommentRepository;

    @InjectMocks
    private IncidentServiceImpl incidentService;

    private Incident testIncident;
    private AppUser testUser;
    private UrbanAsset testAsset;

    @BeforeEach
    void setUp() {
        testUser = new AppUser(1, "Ana García", "ana@example.com", "hash_de_ejemplo_1");
        testAsset = new UrbanAsset(1, "Semáforo");

        testIncident = new Incident();
        testIncident.setId(1);
        testIncident.setReporteCentral("El semáforo no funciona.");
        testIncident.setUrbanAsset(testAsset);
        testIncident.setLocalizacion("Plaza Mayor");
        testIncident.setEstado("Abierta");
        testIncident.setPrioridad("Alta");
        testIncident.setCreador(testUser);
        testIncident.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("getAllIncidents retorna la lista de incidencias en formato DTO")
    void testGetAllIncidents() {
        when(incidentRepository.findAll()).thenReturn(List.of(testIncident));

        List<IncidentDTO> result = incidentService.getAllIncidents();

        assertNotNull(result);
        assertEquals(1, result.size());
        IncidentDTO dto = result.get(0);
        assertEquals(1, dto.getId());
        assertEquals("El semáforo no funciona.", dto.getReporteCentral());
        assertEquals("Plaza Mayor", dto.getLocalizacion());
        assertEquals("Abierta", dto.getEstado());
        assertEquals("Alta", dto.getPrioridad());
        assertEquals(1, dto.getUrbanAssetId());
        assertEquals("Semáforo", dto.getUrbanAssetTipo());
        assertEquals(1, dto.getIdCreador());
        assertEquals("Ana García", dto.getNombreCreador());
        verify(incidentRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("getIncidentById retorna la incidencia y su historial de cambios si existe")
    void testGetIncidentByIdFound() {
        AppUser actor = new AppUser(2, "Luis Pérez", "luis@example.com", "hash_2");
        StatusChange sc = new StatusChange(actor, testIncident, "Abierta → En revisión", "Incidencia asignada para revisión");
        sc.setId(1);
        sc.setInstante(LocalDateTime.now());

        when(incidentRepository.findById(1)).thenReturn(Optional.of(testIncident));
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of(sc));

        Optional<IncidentDTO> opt = incidentService.getIncidentById(1);

        assertTrue(opt.isPresent());
        IncidentDTO dto = opt.get();
        assertEquals(1, dto.getId());
        assertEquals("El semáforo no funciona.", dto.getReporteCentral());
        assertEquals(1, dto.getHistorial().size());
        assertEquals("Abierta → En revisión", dto.getHistorial().get(0).getTransicion());
        assertEquals("Luis Pérez", dto.getHistorial().get(0).getActorNombre());
        verify(incidentRepository, times(1)).findById(1);
        verify(statusChangeRepository, times(1)).findByIncidentIdOrderByInstanteAsc(1);
    }

    @Test
    @DisplayName("getIncidentById retorna Optional.empty si no existe la incidencia")
    void testGetIncidentByIdNotFound() {
        when(incidentRepository.findById(99)).thenReturn(Optional.empty());

        Optional<IncidentDTO> opt = incidentService.getIncidentById(99);

        assertTrue(opt.isEmpty());
        verify(incidentRepository, times(1)).findById(99);
        verifyNoInteractions(statusChangeRepository);
    }

    @Test
    @DisplayName("createIncident guarda los datos obligatorios y la categoría opcional")
    void testCreateIncident() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitulo("  Bache en la calzada  ");
        request.setDescripcion("  Hay un bache frente al número 12.  ");
        request.setCategoria("  Vía pública  ");
        request.setPrioridad("Alta");

        when(appUserRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident saved = invocation.getArgument(0);
            saved.setId(2);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        IncidentDTO result = incidentService.createIncident(request);

        assertEquals(2, result.getId());
        assertEquals("Bache en la calzada", result.getTitulo());
        assertEquals("Hay un bache frente al número 12.", result.getDescripcion());
        assertEquals("Vía pública", result.getCategoria());
        assertEquals("Abierta", result.getEstado());
        assertEquals("Alta", result.getPrioridad());
        assertEquals(1, result.getIdCreador());
        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    @DisplayName("createIncident permite omitir la categoría")
    void testCreateIncidentWithoutCategory() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitulo("Alumbrado apagado");
        request.setDescripcion("La farola no enciende.");

        when(appUserRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident saved = invocation.getArgument(0);
            saved.setId(2);
            return saved;
        });

        IncidentDTO result = incidentService.createIncident(request);

        assertNull(result.getCategoria());
    }

    @Test
    @DisplayName("updateIncidentStatus valida la transición y conserva el historial con actor y motivo")
    void testUpdateIncidentStatus() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("En revisión");
        request.setMotivo("  Asignada al equipo de revisión  ");
        StatusChange statusChange = new StatusChange(
                testUser, testIncident, "Abierta → En revisión", "Asignada al equipo de revisión"
        );
        statusChange.setId(2);
        statusChange.setInstante(LocalDateTime.now());

        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        when(appUserRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(testIncident)).thenReturn(testIncident);
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of(statusChange));

        IncidentDTO result = incidentService.updateIncidentStatus(1, request);

        assertEquals("En revisión", result.getEstado());
        assertEquals(1, result.getHistorial().size());
        assertEquals("Abierta → En revisión", result.getHistorial().get(0).getTransicion());
        assertEquals("Asignada al equipo de revisión", result.getHistorial().get(0).getMotivo());
        assertEquals(1, result.getHistorial().get(0).getActorId());
        verify(statusChangeRepository).save(argThat(change ->
                change.getActor() == testUser
                        && change.getIncident() == testIncident
                        && change.getTransicion().equals("Abierta → En revisión")
                        && change.getMotivo().equals("Asignada al equipo de revisión")
        ));
    }

    @Test
    @DisplayName("updateIncidentStatus rechaza saltos de estado y no altera el historial")
    void testUpdateIncidentStatusRejectsInvalidTransition() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("Resuelta");
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> incidentService.updateIncidentStatus(1, request)
        );

        assertEquals(org.springframework.http.HttpStatus.CONFLICT, exception.getStatusCode());
        assertEquals("Abierta", testIncident.getEstado());
        verify(incidentRepository, never()).save(any(Incident.class));
        verifyNoInteractions(statusChangeRepository);
    }

    @Test
    @DisplayName("updateIncidentStatus rechaza estados desconocidos")
    void testUpdateIncidentStatusRejectsUnknownStatus() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("En espera");
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> incidentService.updateIncidentStatus(1, request)
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(appUserRepository, statusChangeRepository);
    }

    @Test
    @DisplayName("IncidentStatus permite avanzar solo por la secuencia definida")
    void testIncidentStatusTransitionGraph() {
        assertTrue(IncidentStatus.ABIERTA.canTransitionTo(IncidentStatus.EN_REVISION));
        assertTrue(IncidentStatus.EN_REVISION.canTransitionTo(IncidentStatus.RESUELTA));
        assertTrue(IncidentStatus.RESUELTA.canTransitionTo(IncidentStatus.CERRADA));
        assertFalse(IncidentStatus.ABIERTA.canTransitionTo(IncidentStatus.RESUELTA));
        assertFalse(IncidentStatus.CERRADA.canTransitionTo(IncidentStatus.ABIERTA));
        assertNull(IncidentStatus.fromLabel("En espera"));
    }

    @Test
    @DisplayName("createIncident mantiene prioridad Media si la petición no especifica una")
    void testCreateIncidentDefaultPriority() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitulo("Alumbrado apagado");
        request.setDescripcion("La farola no enciende.");
        when(appUserRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals("Media", incidentService.createIncident(request).getPrioridad());
    }

    @Test
    @DisplayName("updateIncidentPriority persiste y devuelve la prioridad actualizada")
    void testUpdateIncidentPriority() {
        UpdateIncidentPriorityRequest request = new UpdateIncidentPriorityRequest();
        request.setPrioridad("Alta");
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        when(incidentRepository.findById(1)).thenReturn(Optional.of(testIncident));
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of());
        when(incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(1)).thenReturn(List.of());

        IncidentDTO result = incidentService.updateIncidentPriority(1, request);

        assertEquals("Alta", result.getPrioridad());
        verify(incidentRepository).save(testIncident);
    }

    @Test
    @DisplayName("createIncidentComment guarda autor y contenido y devuelve los comentarios")
    void testCreateIncidentComment() {
        CreateIncidentCommentRequest request = new CreateIncidentCommentRequest();
        request.setContenido("  Ya se ha avisado al equipo municipal.  ");
        IncidentComment comment = new IncidentComment(
                testUser, testIncident, "Ya se ha avisado al equipo municipal."
        );
        comment.setId(3);
        comment.setCreatedAt(LocalDateTime.now());
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        when(incidentRepository.findById(1)).thenReturn(Optional.of(testIncident));
        when(appUserRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(testUser));
        when(incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(1)).thenReturn(List.of(comment));
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of());

        IncidentDTO result = incidentService.createIncidentComment(1, request);

        assertEquals(1, result.getComentarios().size());
        assertEquals("Ya se ha avisado al equipo municipal.", result.getComentarios().get(0).getContenido());
        assertEquals("Ana García", result.getComentarios().get(0).getActorNombre());
        verify(incidentCommentRepository).save(argThat(saved ->
                saved.getActor() == testUser
                        && saved.getIncident() == testIncident
                        && saved.getContenido().equals("Ya se ha avisado al equipo municipal.")
        ));
    }
}
