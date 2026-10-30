package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.StatusChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusChangeRepository extends JpaRepository<StatusChange, Integer> {
    List<StatusChange> findByIncidentIdOrderByInstanteAsc(Integer incidentId);
}

