package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.StatusChange;
import java.time.LocalDateTime;

public class StatusChangeDTO {

    private Integer id;
    private Integer actorId;
    private String actorNombre;
    private String transicion;
    private String motivo;
    private LocalDateTime instante;

    public StatusChangeDTO() {
    }

    public StatusChangeDTO(Integer id, Integer actorId, String actorNombre, String transicion, String motivo, LocalDateTime instante) {
        this.id = id;
        this.actorId = actorId;
        this.actorNombre = actorNombre;
        this.transicion = transicion;
        this.motivo = motivo;
        this.instante = instante;
    }

    public static StatusChangeDTO fromEntity(StatusChange sc) {
        if (sc == null) return null;
        StatusChangeDTO dto = new StatusChangeDTO();
        dto.setId(sc.getId());
        if (sc.getActor() != null) {
            dto.setActorId(sc.getActor().getId());
            dto.setActorNombre(sc.getActor().getNombre());
        }
        dto.setTransicion(sc.getTransicion());
        dto.setMotivo(sc.getMotivo());
        dto.setInstante(sc.getInstante());
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

    public String getTransicion() {
        return transicion;
    }

    public void setTransicion(String transicion) {
        this.transicion = transicion;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public LocalDateTime getInstante() {
        return instante;
    }

    public void setInstante(LocalDateTime instante) {
        this.instante = instante;
    }
}

