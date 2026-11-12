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
import org.springframework.web.bind.annotation.CrossOrigin;
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
@CrossOrigin(origins = "*")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<List<IncidentDTO>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(@PathVariable Integer id) {
        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<IncidentDTO> createIncident(@Valid @RequestBody CreateIncidentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IncidentDTO> updateIncidentStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateIncidentStatusRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, request));
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<IncidentDTO> updateIncidentPriority(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateIncidentPriorityRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentPriority(id, request));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<IncidentDTO> createIncidentComment(
            @PathVariable Integer id,
            @Valid @RequestBody CreateIncidentCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                incidentService.createIncidentComment(id, request)
        );
    }
}
