package com.example.urbanpulse.controller;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import jakarta.validation.Valid;
import com.example.urbanpulse.service.IncidentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(@PathVariable Integer id) {
        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping({"", "/mine"})
    public ResponseEntity<List<IncidentDTO>> getMyIncidents(@AuthenticationPrincipal Jwt jwt) {
        Integer creatorId = Integer.valueOf(jwt.getSubject());
        return ResponseEntity.ok(incidentService.getMyIncidents(creatorId));
    }

    @PostMapping
    public ResponseEntity<IncidentDTO> createIncident(@Valid @RequestBody CreateIncidentRequest request,
                                                      @AuthenticationPrincipal Jwt jwt) {
        // Requiere token (SecurityConfig): el creador es el usuario autenticado
        Integer creatorId = Integer.valueOf(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(request, creatorId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OPERATOR', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<IncidentDTO> updateIncidentStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer actorId = Integer.valueOf(jwt.getSubject());
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, request, actorId));
    }

    @PatchMapping("/{id}/priority")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    public ResponseEntity<IncidentDTO> updateIncidentPriority(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateIncidentPriorityRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentPriority(id, request));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<IncidentDTO> createIncidentComment(
            @PathVariable Integer id,
            @Valid @RequestBody CreateIncidentCommentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Integer actorId = Integer.valueOf(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(
                incidentService.createIncidentComment(id, request, actorId)
        );
    }
}
