package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.Rol;
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

import java.math.BigDecimal;
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
    @DisplayName("getIncidents filtra por creador para ciudadanos")
    void testGetCitizenIncidents() {
        when(incidentRepository.findByCreadorIdOrderByCreatedAtDesc(1)).thenReturn(List.of(testIncident));

        List<IncidentDTO> result = incidentService.getIncidents(1, Rol.CITIZEN);

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
        verify(incidentRepository).findByCreadorIdOrderByCreatedAtDesc(1);
        verify(incidentRepository, never()).findAll();
    }

    @Test
    @DisplayName("getIncidents devuelve todas las incidencias a roles no ciudadanos")
    void testGetAllIncidentsForOperator() {
        Incident otherIncident = new Incident();
        otherIncident.setId(2);
        otherIncident.setReporteCentral("Incidencia de otro usuario.");
        otherIncident.setCreador(new AppUser(2, "Luis Pérez", "luis@example.com", "hash_2"));
        when(incidentRepository.findAll()).thenReturn(List.of(testIncident, otherIncident));

        List<IncidentDTO> result = incidentService.getIncidents(1, Rol.OPERATOR);

        assertEquals(2, result.size());
        assertEquals(1, result.get(0).getIdCreador());
        assertEquals(2, result.get(1).getIdCreador());
        verify(incidentRepository).findAll();
        verify(incidentRepository, never()).findByCreadorIdOrderByCreatedAtDesc(1);
    }

    @Test
    @DisplayName("getIncidents devuelve todas las incidencias a administración")
    void testGetAllIncidentsForAdmin() {
        when(incidentRepository.findAll()).thenReturn(List.of(testIncident));

        List<IncidentDTO> result = incidentService.getIncidents(1, Rol.ADMIN);

        assertEquals(1, result.size());
        verify(incidentRepository).findAll();
        verify(incidentRepository, never()).findByCreadorIdOrderByCreatedAtDesc(1);
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
        request.setLatitud(new BigDecimal("36.721274"));
        request.setLongitud(new BigDecimal("-4.421399"));

        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident saved = invocation.getArgument(0);
            saved.setId(2);
            saved.setCreatedAt(LocalDateTime.now());
            return saved;
        });

        IncidentDTO result = incidentService.createIncident(request, 1);

        assertEquals(2, result.getId());
        assertEquals("Bache en la calzada", result.getTitulo());
        assertEquals("Hay un bache frente al número 12.", result.getDescripcion());
        assertEquals("Vía pública", result.getCategoria());
        assertEquals("Abierta", result.getEstado());
        assertEquals("Alta", result.getPrioridad());
        assertEquals(1, result.getIdCreador());
        assertEquals(new BigDecimal("36.721274"), result.getLatitud());
        assertEquals(new BigDecimal("-4.421399"), result.getLongitud());
        verify(incidentRepository).save(any(Incident.class));
    }

    @Test
    @DisplayName("createIncident permite omitir la categoría")
    void testCreateIncidentWithoutCategory() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitulo("Alumbrado apagado");
        request.setDescripcion("La farola no enciende.");
        request.setLatitud(new BigDecimal("36.7"));
        request.setLongitud(new BigDecimal("-4.4"));

        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> {
            Incident saved = invocation.getArgument(0);
            saved.setId(2);
            return saved;
        });

        IncidentDTO result = incidentService.createIncident(request, 1);

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
        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(testIncident)).thenReturn(testIncident);
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of(statusChange));

        IncidentDTO result = incidentService.updateIncidentStatus(1, request, 1);

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
                () -> incidentService.updateIncidentStatus(1, request, 1)
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
                () -> incidentService.updateIncidentStatus(1, request, 1)
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verifyNoInteractions(appUserRepository, statusChangeRepository);
    }

    @Test
    @DisplayName("IncidentStatus permite avanzar solo por la secuencia definida")
    void testIncidentStatusTransitionGraph() {
        assertTrue(IncidentStatus.ABIERTA.canTransitionTo(IncidentStatus.EN_REVISION));
        assertTrue(IncidentStatus.ABIERTA.canTransitionTo(IncidentStatus.RECHAZADA));
        assertTrue(IncidentStatus.EN_REVISION.canTransitionTo(IncidentStatus.RESUELTA));
        assertTrue(IncidentStatus.EN_REVISION.canTransitionTo(IncidentStatus.RECHAZADA));
        assertTrue(IncidentStatus.RESUELTA.canTransitionTo(IncidentStatus.CERRADA));
        assertTrue(IncidentStatus.RESUELTA.canTransitionTo(IncidentStatus.REABIERTA));
        assertTrue(IncidentStatus.CERRADA.canTransitionTo(IncidentStatus.REABIERTA));
        assertTrue(IncidentStatus.REABIERTA.canTransitionTo(IncidentStatus.EN_REVISION));
        assertFalse(IncidentStatus.ABIERTA.canTransitionTo(IncidentStatus.RESUELTA));
        assertFalse(IncidentStatus.CERRADA.canTransitionTo(IncidentStatus.ABIERTA));
        assertFalse(IncidentStatus.RECHAZADA.canTransitionTo(IncidentStatus.REABIERTA));
        assertTrue(IncidentStatus.RECHAZADA.requiresReason());
        assertTrue(IncidentStatus.REABIERTA.requiresReason());
        assertNull(IncidentStatus.fromLabel("En espera"));
    }

    @Test
    @DisplayName("updateIncidentStatus exige motivo para rechazar")
    void testRejectIncidentRequiresReason() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("Rechazada");
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        testIncident.setEstado("En revisión");

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> incidentService.updateIncidentStatus(1, request, 1)
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("En revisión", testIncident.getEstado());
        verify(incidentRepository, never()).save(any(Incident.class));
        verifyNoInteractions(appUserRepository, statusChangeRepository);
    }

    @Test
    @DisplayName("updateIncidentStatus exige motivo para reabrir")
    void testReopenIncidentRequiresReason() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("Reabierta");
        testIncident.setEstado("Cerrada");
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));

        org.springframework.web.server.ResponseStatusException exception = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> incidentService.updateIncidentStatus(1, request, 1)
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Cerrada", testIncident.getEstado());
        verify(incidentRepository, never()).save(any(Incident.class));
        verifyNoInteractions(appUserRepository, statusChangeRepository);
    }

    @Test
    @DisplayName("updateIncidentStatus registra el rechazo con motivo y actor")
    void testRejectIncidentWithReason() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("Rechazada");
        request.setMotivo("  Fuera del ámbito municipal  ");
        testIncident.setEstado("En revisión");
        StatusChange statusChange = new StatusChange(
                testUser, testIncident, "En revisión → Rechazada", "Fuera del ámbito municipal"
        );
        statusChange.setId(5);
        statusChange.setInstante(LocalDateTime.now());
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(testIncident)).thenReturn(testIncident);
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of(statusChange));

        IncidentDTO result = incidentService.updateIncidentStatus(1, request, 1);

        assertEquals("Rechazada", result.getEstado());
        assertEquals("En revisión → Rechazada", result.getHistorial().get(0).getTransicion());
        assertEquals("Fuera del ámbito municipal", result.getHistorial().get(0).getMotivo());
        verify(statusChangeRepository).save(argThat(change ->
                change.getActor() == testUser
                        && change.getTransicion().equals("En revisión → Rechazada")
                        && change.getMotivo().equals("Fuera del ámbito municipal")
        ));
    }

    @Test
    @DisplayName("updateIncidentStatus reabre una incidencia cerrada y registra el motivo")
    void testReopenClosedIncidentWithReason() {
        UpdateIncidentStatusRequest request = new UpdateIncidentStatusRequest();
        request.setEstado("Reabierta");
        request.setMotivo("La reparación no resolvió el problema.");
        testIncident.setEstado("Cerrada");
        StatusChange statusChange = new StatusChange(
                testUser, testIncident, "Cerrada → Reabierta", "La reparación no resolvió el problema."
        );
        statusChange.setId(6);
        statusChange.setInstante(LocalDateTime.now());
        when(incidentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(testIncident));
        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(testIncident)).thenReturn(testIncident);
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of(statusChange));

        IncidentDTO result = incidentService.updateIncidentStatus(1, request, 1);

        assertEquals("Reabierta", result.getEstado());
        assertEquals("Cerrada → Reabierta", result.getHistorial().get(0).getTransicion());
        verify(statusChangeRepository).save(argThat(change ->
                change.getActor() == testUser
                        && change.getTransicion().equals("Cerrada → Reabierta")
                        && change.getMotivo().equals("La reparación no resolvió el problema.")
        ));
    }

    @Test
    @DisplayName("createIncident mantiene prioridad Media si la petición no especifica una")
    void testCreateIncidentDefaultPriority() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitulo("Alumbrado apagado");
        request.setDescripcion("La farola no enciende.");
        request.setLatitud(new BigDecimal("36.7"));
        request.setLongitud(new BigDecimal("-4.4"));
        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals("Media", incidentService.createIncident(request, 1).getPrioridad());
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
        when(appUserRepository.findById(1)).thenReturn(Optional.of(testUser));
        when(incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(1)).thenReturn(List.of(comment));
        when(statusChangeRepository.findByIncidentIdOrderByInstanteAsc(1)).thenReturn(List.of());

        IncidentDTO result = incidentService.createIncidentComment(1, request, 1);

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
