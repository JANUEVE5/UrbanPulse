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
@Table(name = "\"Incident\"")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "reporte_central", nullable = false, length = 400)
    private String reporteCentral;

    @Column(name = "titulo", length = 100)
    private String titulo;

    @Column(name = "descripcion", length = 400)
    private String descripcion;

    @Column(name = "categoria", length = 50)
    private String categoria;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "urban_asset_id")
    private UrbanAsset urbanAsset;

    @Column(name = "localizacion", length = 200)
    private String localizacion;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado;

    @Column(name = "prioridad", nullable = false, length = 20)
    private String prioridad;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_creador", nullable = false)
    private AppUser creador;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Incident() {
    }

    public Incident(String reporteCentral, UrbanAsset urbanAsset, String localizacion, String estado, String prioridad, AppUser creador) {
        this.reporteCentral = reporteCentral;
        this.urbanAsset = urbanAsset;
        this.localizacion = localizacion;
        this.estado = estado;
        this.prioridad = prioridad;
        this.creador = creador;
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getReporteCentral() {
        return reporteCentral;
    }

    public void setReporteCentral(String reporteCentral) {
        this.reporteCentral = reporteCentral;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public UrbanAsset getUrbanAsset() {
        return urbanAsset;
    }

    public void setUrbanAsset(UrbanAsset urbanAsset) {
        this.urbanAsset = urbanAsset;
    }

    public String getLocalizacion() {
        return localizacion;
    }

    public void setLocalizacion(String localizacion) {
        this.localizacion = localizacion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public AppUser getCreador() {
        return creador;
    }

    public void setCreador(AppUser creador) {
        this.creador = creador;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
