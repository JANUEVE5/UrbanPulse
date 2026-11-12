package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;

import java.util.List;
import java.util.Optional;

public interface IncidentService {
    List<IncidentDTO> getAllIncidents();
    Optional<IncidentDTO> getIncidentById(Integer id);
    IncidentDTO createIncident(CreateIncidentRequest request);
    IncidentDTO updateIncidentStatus(Integer id, UpdateIncidentStatusRequest request);
    IncidentDTO updateIncidentPriority(Integer id, UpdateIncidentPriorityRequest request);
    IncidentDTO createIncidentComment(Integer id, CreateIncidentCommentRequest request);
}
