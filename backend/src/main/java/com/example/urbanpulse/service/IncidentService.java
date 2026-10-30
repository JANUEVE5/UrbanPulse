package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;

import java.util.List;
import java.util.Optional;

public interface IncidentService {
    List<IncidentDTO> getAllIncidents();
    Optional<IncidentDTO> getIncidentById(Integer id);
    IncidentDTO createIncident(CreateIncidentRequest request);
}
