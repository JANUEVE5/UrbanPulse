package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.IncidentComment;

import java.time.LocalDateTime;

public class IncidentCommentDTO {

    private Integer id;
    private Integer actorId;
    private String actorNombre;
    private String contenido;
    private LocalDateTime createdAt;

    public static IncidentCommentDTO fromEntity(IncidentComment comment) {
        IncidentCommentDTO dto = new IncidentCommentDTO();
        dto.setId(comment.getId());
        dto.setActorId(comment.getActor().getId());
        dto.setActorNombre(comment.getActor().getNombre());
        dto.setContenido(comment.getContenido());
        dto.setCreatedAt(comment.getCreatedAt());
        return dto;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getActorId() {
        return actorId;
    }

    public void setActorId(Integer actorId) {
        this.actorId = actorId;
    }

    public String getActorNombre() {
        return actorNombre;
    }

    public void setActorNombre(String actorNombre) {
        this.actorNombre = actorNombre;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
