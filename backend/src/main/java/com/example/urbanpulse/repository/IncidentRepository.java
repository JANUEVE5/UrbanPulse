package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Integer> {
    List<Incident> findByCreadorIdOrderByCreatedAtDesc(Integer creadorId);
    Optional<Incident> findByIdAndCreadorId(Integer id, Integer creadorId);
}
