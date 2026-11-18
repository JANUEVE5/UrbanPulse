package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.dto.UpdateIncidentUrbanAssetRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface IncidentService {
    Page<IncidentDTO> getIncidents(
            Integer creatorId,
            Rol role,
            List<String> estados,
            String prioridad,
            String categoria,
            Pageable pageable
    );
    default Page<IncidentDTO> getIncidents(Integer creatorId, Rol role, List<String> estados, Pageable pageable) {
        return getIncidents(creatorId, role, estados, null, null, pageable);
    }
    default Page<IncidentDTO> getIncidents(Integer creatorId, Rol role, Pageable pageable) {
        return getIncidents(creatorId, role, null, null, null, pageable);
    }
    Optional<IncidentDTO> getIncidentById(Integer id);
    IncidentDTO createIncident(CreateIncidentRequest request, Integer creatorId);
    IncidentDTO updateIncidentStatus(Integer id, UpdateIncidentStatusRequest request, Integer actorId);
    IncidentDTO updateIncidentPriority(Integer id, UpdateIncidentPriorityRequest request);
    IncidentDTO updateIncidentUrbanAsset(Integer id, UpdateIncidentUrbanAssetRequest request);
    IncidentDTO createIncidentComment(Integer id, CreateIncidentCommentRequest request, Integer actorId);
}
