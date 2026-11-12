package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;

import java.util.List;
import java.util.Optional;

public interface IncidentService {
    List<IncidentDTO> getMyIncidents(Integer creatorId);
    Optional<IncidentDTO> getIncidentById(Integer id);
    /** Registra una incidencia a nombre del usuario autenticado {@code creatorId}. */
    IncidentDTO createIncident(CreateIncidentRequest request, Integer creatorId);
}
