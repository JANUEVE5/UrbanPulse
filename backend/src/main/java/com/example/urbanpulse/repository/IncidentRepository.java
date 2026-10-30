package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Integer> {
}

