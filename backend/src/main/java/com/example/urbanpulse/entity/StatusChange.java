package com.example.urbanpulse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"StatusChange\"")
public class StatusChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id", nullable = false)
    private AppUser actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "transicion", nullable = false, length = 100)
    private String transicion;

    @Column(name = "motivo", length = 400)
    private String motivo;

    @Column(name = "instante", nullable = false)
    private LocalDateTime instante;

    public StatusChange() {
    }

    public StatusChange(AppUser actor, Incident incident, String transicion, String motivo) {
        this.actor = actor;
        this.incident = incident;
        this.transicion = transicion;
        this.motivo = motivo;
    }

    @PrePersist
    public void prePersist() {
        if (this.instante == null) {
            this.instante = LocalDateTime.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public AppUser getActor() {
        return actor;
    }

    public void setActor(AppUser actor) {
        this.actor = actor;
    }

    public Incident getIncident() {
        return incident;
    }

    public void setIncident(Incident incident) {
        this.incident = incident;
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

