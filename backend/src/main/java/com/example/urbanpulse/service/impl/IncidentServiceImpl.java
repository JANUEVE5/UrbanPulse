package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.IncidentDTO;
import com.example.urbanpulse.entity.StatusChange;
import com.example.urbanpulse.repository.IncidentRepository;
import com.example.urbanpulse.repository.StatusChangeRepository;
import com.example.urbanpulse.service.IncidentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final StatusChangeRepository statusChangeRepository;

    public IncidentServiceImpl(
            IncidentRepository incidentRepository,
            StatusChangeRepository statusChangeRepository
    ) {
        this.incidentRepository = incidentRepository;
        this.statusChangeRepository = statusChangeRepository;
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
}
