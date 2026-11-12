package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.IncidentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentCommentRepository extends JpaRepository<IncidentComment, Integer> {
    List<IncidentComment> findByIncidentIdOrderByCreatedAtAsc(Integer incidentId);
}
