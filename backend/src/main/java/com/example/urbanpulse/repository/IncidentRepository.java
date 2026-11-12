package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.Incident;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select incident from Incident incident where incident.id = :id")
    Optional<Incident> findByIdForUpdate(@Param("id") Integer id);

    List<Incident> findByCreadorIdOrderByCreatedAtDesc(Integer creadorId);
    Optional<Incident> findByIdAndCreadorId(Integer id, Integer creadorId);
}
