package com.example.urbanpulse.controller;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.PageResponse;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.dto.UpdateIncidentUrbanAssetRequest;
import jakarta.validation.Valid;
import com.example.urbanpulse.service.IncidentService;
import com.example.urbanpulse.service.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final String DEFAULT_SORT = "createdAt,desc";
    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("id", "createdAt", "titulo", "estado", "prioridad", "categoria");

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

    private static final Set<String> ALLOWED_PRIORITIES = Set.of("Baja", "Media", "Alta");

    @GetMapping({"", "/mine"})
    public ResponseEntity<PageResponse<IncidentDTO>> getIncidents(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String prioridad,
            @RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE) int size,
            @RequestParam(defaultValue = DEFAULT_SORT) String sort
    ) {
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "page debe ser no negativo y size debe estar entre 1 y " + MAX_PAGE_SIZE + "."
            );
        }

        String validatedPrioridad = null;
        if (prioridad != null && !prioridad.isBlank() && !prioridad.equalsIgnoreCase("todas")) {
            validatedPrioridad = ALLOWED_PRIORITIES.stream()
                    .filter(p -> p.equalsIgnoreCase(prioridad.trim()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Prioridad no válida: " + prioridad + ". Valores permitidos: Baja, Media, Alta."
                    ));
        }

        String validatedCategoria = (categoria != null && !categoria.isBlank() && !categoria.equalsIgnoreCase("todas"))
                ? categoria.trim()
                : null;

        Integer creatorId = Integer.valueOf(jwt.getSubject());
        Rol role = Rol.valueOf(jwt.getClaimAsString(SecurityConfig.ROLE_CLAIM));
        Pageable pageable = createPageable(page, size, sort);
        List<String> estados = parseEstadoFilter(estado);

        boolean hasExtra = validatedPrioridad != null || validatedCategoria != null;
        Page<IncidentDTO> incidents;
        if (!hasExtra && (estados == null || estados.isEmpty())) {
            incidents = incidentService.getIncidents(creatorId, role, pageable);
        } else if (!hasExtra) {
            incidents = incidentService.getIncidents(creatorId, role, estados, pageable);
        } else {
            incidents = incidentService.getIncidents(creatorId, role, estados, validatedPrioridad, validatedCategoria, pageable);
        }
        return ResponseEntity.ok(PageResponse.from(incidents));
    }

    private List<String> parseEstadoFilter(String estado) {
        if (estado == null || estado.isBlank() || estado.equalsIgnoreCase("todas")) {
            return null;
        }
        if (estado.equalsIgnoreCase("activas")) {
            return List.of(
                    IncidentStatus.ABIERTA.getLabel(),
                    IncidentStatus.EN_REVISION.getLabel(),
                    IncidentStatus.REABIERTA.getLabel()
            );
        }
        if (estado.equalsIgnoreCase("resueltas")) {
            return List.of(
                    IncidentStatus.RESUELTA.getLabel(),
                    IncidentStatus.CERRADA.getLabel()
            );
        }

        String[] tokens = estado.split(",");
        List<String> result = new ArrayList<>();
        for (String rawToken : tokens) {
            String token = rawToken.trim();
            if (token.isEmpty()) continue;
            IncidentStatus matched = null;
            for (IncidentStatus s : IncidentStatus.values()) {
                if (s.getLabel().equalsIgnoreCase(token) || s.name().equalsIgnoreCase(token)) {
                    matched = s;
                    break;
                }
            }
            if (matched == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Estado no válido: " + token
                );
            }
            result.add(matched.getLabel());
        }
        return result.isEmpty() ? null : result;
    }

    private Pageable createPageable(int page, int size, String sort) {
        String[] parts = sort.split(",", -1);
        if (parts.length != 2 || !ALLOWED_SORT_FIELDS.contains(parts[0])) {
            throw invalidSort();
        }

        Sort.Direction direction = Sort.Direction.fromOptionalString(parts[1])
                .orElseThrow(IncidentController::invalidSort);
        Sort pageSort = Sort.by(direction, parts[0]);
        if (!"id".equals(parts[0])) {
            pageSort = pageSort.and(Sort.by(Sort.Direction.DESC, "id"));
        }
        return PageRequest.of(page, size, pageSort);
    }

    private static ResponseStatusException invalidSort() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El parámetro sort debe tener el formato campo,dirección y usar un campo permitido."
        );
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

    @PatchMapping("/{id}/urban-asset")
    @PreAuthorize("hasAnyRole('OPERATOR', 'ADMIN')")
    public ResponseEntity<IncidentDTO> updateIncidentUrbanAsset(
            @PathVariable Integer id,
            @RequestBody UpdateIncidentUrbanAssetRequest request
    ) {
        return ResponseEntity.ok(incidentService.updateIncidentUrbanAsset(id, request));
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
