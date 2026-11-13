package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.dto.UpdateIncidentUrbanAssetRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.Rol;
import com.example.urbanpulse.entity.IncidentComment;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.repository.IncidentCommentRepository;
import com.example.urbanpulse.repository.IncidentRepository;
import com.example.urbanpulse.repository.StatusChangeRepository;
import com.example.urbanpulse.service.IncidentService;
import com.example.urbanpulse.service.IncidentStatus;
import com.example.urbanpulse.service.UrbanAssetService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class IncidentServiceImpl implements IncidentService {

    @Override
    public List<IncidentDTO> getIncidents(Integer creatorId, Rol role) {
        List<Incident> incidents = role == Rol.CITIZEN
                ? incidentRepository.findByCreadorIdOrderByCreatedAtDesc(creatorId)
                : incidentRepository.findAll();
        return incidents
                .stream()
                .map(IncidentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private final IncidentRepository incidentRepository;
    private final StatusChangeRepository statusChangeRepository;
    private final AppUserRepository appUserRepository;
    private final IncidentCommentRepository incidentCommentRepository;
    private final UrbanAssetService urbanAssetService;

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            StatusChangeRepository statusChangeRepository,
            AppUserRepository appUserRepository,
            IncidentCommentRepository incidentCommentRepository,
            UrbanAssetService urbanAssetService
    ) {
        this.incidentRepository = incidentRepository;
        this.statusChangeRepository = statusChangeRepository;
        this.appUserRepository = appUserRepository;
        this.incidentCommentRepository = incidentCommentRepository;
        this.urbanAssetService = urbanAssetService;
    }

    @Override
    public Optional<IncidentDTO> getIncidentById(Integer id) {
        return incidentRepository.findById(id)
                .map(incident -> {
                    List<StatusChange> statusChanges = statusChangeRepository.findByIncidentIdOrderByInstanteAsc(id);
                    List<IncidentComment> comments = incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(id);
                    return IncidentDTO.fromEntity(incident, statusChanges, comments);
                });
    }

    @Override
    @Transactional
    public IncidentDTO createIncident(CreateIncidentRequest request, Integer creatorId) {
        // El creador es el usuario del token (RF01); si ya no existe, el token no es válido
        AppUser creator = appUserRepository.findById(creatorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "El usuario autenticado ya no existe."
                ));

        String title = request.getTitulo().trim();
        String description = request.getDescripcion().trim();
        String category = request.getCategoria() == null || request.getCategoria().isBlank()
                ? null
                : request.getCategoria().trim();

        Incident incident = new Incident();
        incident.setTitulo(title);
        incident.setDescripcion(description);
        incident.setCategoria(category);
        incident.setReporteCentral(description);
        incident.setLatitud(request.getLatitud());
        incident.setLongitud(request.getLongitud());
        incident.setEstado("Abierta");
        incident.setPrioridad(request.getPrioridad() == null ? "Media" : request.getPrioridad());
        incident.setCreador(creator);

        // Activo urbano elegido por el usuario entre los cercanos (RF22): debe existir y estar cerca
        if (request.getUrbanAssetId() != null) {
            incident.setUrbanAsset(urbanAssetService.getAssetNear(
                    request.getUrbanAssetId(), request.getLatitud(), request.getLongitud()));
        }

        String localizacion = request.getLocalizacion() != null && !request.getLocalizacion().isBlank()
                ? request.getLocalizacion().trim()
                : null;
        incident.setLocalizacion(localizacion);

        return IncidentDTO.fromEntity(incidentRepository.save(incident));
    }

    @Override
    @Transactional
    public IncidentDTO updateIncidentStatus(Integer id, UpdateIncidentStatusRequest request, Integer actorId) {
        Incident incident = incidentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la incidencia con identificador " + id + "."
                ));

        IncidentStatus currentStatus = IncidentStatus.fromLabel(incident.getEstado());
        IncidentStatus targetStatus = IncidentStatus.fromLabel(request.getEstado().trim());
        if (targetStatus == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Estado no válido. Los estados permitidos son: Abierta, En revisión, Resuelta, Cerrada, Rechazada y Reabierta."
            );
        }
        if (currentStatus == null || !currentStatus.canTransitionTo(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transición no permitida desde '" + incident.getEstado()
                            + "' hasta '" + targetStatus.getLabel() + "'."
            );
        }

        String motivo = request.getMotivo() == null || request.getMotivo().isBlank()
                ? null
                : request.getMotivo().trim();
        if (targetStatus.requiresReason() && motivo == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe indicar un motivo para rechazar o reabrir una incidencia."
            );
        }

        AppUser actor = appUserRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "El usuario autenticado ya no existe."
                ));

        incident.setEstado(targetStatus.getLabel());
        incidentRepository.save(incident);
        statusChangeRepository.save(new StatusChange(
                actor,
                incident,
                currentStatus.getLabel() + " → " + targetStatus.getLabel(),
                motivo
        ));

        List<StatusChange> statusChanges = statusChangeRepository.findByIncidentIdOrderByInstanteAsc(id);
        List<IncidentComment> comments = incidentCommentRepository.findByIncidentIdOrderByCreatedAtAsc(id);
        return IncidentDTO.fromEntity(incident, statusChanges, comments);
    }

    @Override
    @Transactional
    public IncidentDTO updateIncidentPriority(Integer id, UpdateIncidentPriorityRequest request) {
        Incident incident = incidentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la incidencia con identificador " + id + "."
                ));

        incident.setPrioridad(request.getPrioridad());
        incidentRepository.save(incident);
        return getIncidentById(id).orElseThrow();
    }

    @Override
    @Transactional
    public IncidentDTO updateIncidentUrbanAsset(Integer id, UpdateIncidentUrbanAssetRequest request) {
        Incident incident = incidentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la incidencia con identificador " + id + "."
                ));

        // El operador confirma, cambia o quita el activo propuesto (RF22)
        incident.setUrbanAsset(request.getUrbanAssetId() == null
                ? null
                : urbanAssetService.getAssetNear(request.getUrbanAssetId(), incident.getLatitud(), incident.getLongitud()));
        incidentRepository.save(incident);
        return getIncidentById(id).orElseThrow();
    }

    @Override
    @Transactional
    public IncidentDTO createIncidentComment(Integer id, CreateIncidentCommentRequest request, Integer actorId) {
        Incident incident = incidentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la incidencia con identificador " + id + "."
                ));
        AppUser actor = appUserRepository.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "El usuario autenticado ya no existe."
                ));

        incidentCommentRepository.save(new IncidentComment(
                actor,
                incident,
                request.getContenido().trim()
        ));
        return getIncidentById(id).orElseThrow();
    }
}
