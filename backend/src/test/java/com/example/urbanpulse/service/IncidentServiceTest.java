package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.entity.UrbanAsset;
import com.example.urbanpulse.repository.IncidentRepository;
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
}
