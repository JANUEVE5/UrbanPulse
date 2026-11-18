package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.Incident;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Integer>, JpaSpecificationExecutor<Incident> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select incident from Incident incident where incident.id = :id")
    Optional<Incident> findByIdForUpdate(@Param("id") Integer id);

    Page<Incident> findByCreadorId(Integer creadorId, Pageable pageable);
    Page<Incident> findByCreadorIdAndEstadoIn(Integer creadorId, java.util.Collection<String> estados, Pageable pageable);
    Page<Incident> findByEstadoIn(java.util.Collection<String> estados, Pageable pageable);
    Optional<Incident> findByIdAndCreadorId(Integer id, Integer creadorId);
}
