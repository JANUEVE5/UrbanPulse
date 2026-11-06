package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.dto.CreateIncidentRequest;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.repository.AppUserRepository;
import com.example.urbanpulse.repository.IncidentRepository;
import com.example.urbanpulse.repository.StatusChangeRepository;
import com.example.urbanpulse.service.IncidentService;
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

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            StatusChangeRepository statusChangeRepository,
            AppUserRepository appUserRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.statusChangeRepository = statusChangeRepository;
        this.appUserRepository = appUserRepository;
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
                    return IncidentDTO.fromEntity(incident, statusChanges);
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
        incident.setPrioridad("Media");
        incident.setCreador(creator);

        return IncidentDTO.fromEntity(incidentRepository.save(incident));
    }
}
