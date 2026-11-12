package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.dto.CreateIncidentCommentRequest;
import com.example.urbanpulse.dto.UpdateIncidentStatusRequest;
import com.example.urbanpulse.dto.UpdateIncidentPriorityRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.IncidentComment;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.repository.IncidentCommentRepository;
import com.example.urbanpulse.repository.IncidentRepository;
import com.example.urbanpulse.repository.StatusChangeRepository;
import com.example.urbanpulse.service.IncidentService;
import com.example.urbanpulse.service.IncidentStatus;
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

    private final IncidentRepository incidentRepository;
    private final StatusChangeRepository statusChangeRepository;
    private final AppUserRepository appUserRepository;
    private final IncidentCommentRepository incidentCommentRepository;

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            StatusChangeRepository statusChangeRepository,
            AppUserRepository appUserRepository,
            IncidentCommentRepository incidentCommentRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.statusChangeRepository = statusChangeRepository;
        this.appUserRepository = appUserRepository;
        this.incidentCommentRepository = incidentCommentRepository;
    }

    @Override
    public List<IncidentDTO> getAllIncidents() {
        return incidentRepository.findAll()
                .stream()
                .map(IncidentDTO::fromEntity)
                .collect(Collectors.toList());
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
    public IncidentDTO createIncident(CreateIncidentRequest request) {
        AppUser creator = appUserRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se puede registrar una incidencia porque no hay usuarios registrados."
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
        incident.setEstado("Abierta");
        incident.setPrioridad(request.getPrioridad() == null ? "Media" : request.getPrioridad());
        incident.setCreador(creator);

        return IncidentDTO.fromEntity(incidentRepository.save(incident));
    }

    @Override
    @Transactional
    public IncidentDTO updateIncidentStatus(Integer id, UpdateIncidentStatusRequest request) {
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
                    "Estado no válido. Los estados permitidos son: Abierta, En revisión, Resuelta y Cerrada."
            );
        }
        if (currentStatus == null || !currentStatus.canTransitionTo(targetStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Transición no permitida desde '" + incident.getEstado()
                            + "' hasta '" + targetStatus.getLabel() + "'."
            );
        }

        AppUser actor = appUserRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se puede registrar el cambio porque no hay usuarios registrados."
                ));

        String motivo = request.getMotivo() == null || request.getMotivo().isBlank()
                ? null
                : request.getMotivo().trim();

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
    public IncidentDTO createIncidentComment(Integer id, CreateIncidentCommentRequest request) {
        Incident incident = incidentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe la incidencia con identificador " + id + "."
                ));
        AppUser actor = appUserRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "No se puede registrar el comentario porque no hay usuarios registrados."
                ));

        incidentCommentRepository.save(new IncidentComment(
                actor,
                incident,
                request.getContenido().trim()
        ));
        return getIncidentById(id).orElseThrow();
    }
}
