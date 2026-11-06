package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.Incident;
import com.example.urbanpulse.entity.StatusChange;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class IncidentDTO {

    private Integer id;
    private String titulo;
    private String descripcion;
    private String categoria;
    private String reporteCentral;
    private Integer urbanAssetId;
    private String urbanAssetTipo;
    private String localizacion;
    private String estado;
    private String prioridad;
    private Integer idCreador;
    private String nombreCreador;
    private String correoCreador;
    private LocalDateTime createdAt;
    private List<StatusChangeDTO> historial = new ArrayList<>();

    public IncidentDTO() {
    }

    public static IncidentDTO fromEntity(Incident incident) {
        return fromEntity(incident, null);
    }

    public static IncidentDTO fromEntity(Incident incident, List<StatusChange> statusChanges) {
        if (incident == null) {
            return null;
        }

        IncidentDTO dto = new IncidentDTO();
        dto.setId(incident.getId());
        dto.setReporteCentral(incident.getReporteCentral());
        dto.setTitulo(incident.getTitulo() != null ? incident.getTitulo() : incident.getReporteCentral());
        dto.setDescripcion(incident.getDescripcion() != null ? incident.getDescripcion() : incident.getReporteCentral());
        dto.setCategoria(incident.getCategoria());

        if (incident.getUrbanAsset() != null) {
            dto.setUrbanAssetId(incident.getUrbanAsset().getId());
            dto.setUrbanAssetTipo(incident.getUrbanAsset().getTipo());
        }

        dto.setLocalizacion(incident.getLocalizacion());
        dto.setEstado(incident.getEstado());
        dto.setPrioridad(incident.getPrioridad());

        if (incident.getCreador() != null) {
            dto.setIdCreador(incident.getCreador().getId());
            dto.setNombreCreador(incident.getCreador().getNombre());
            dto.setCorreoCreador(incident.getCreador().getCorreo());
        }

        dto.setCreatedAt(incident.getCreatedAt());

        if (statusChanges != null && !statusChanges.isEmpty()) {
            dto.setHistorial(
                    statusChanges.stream()
                            .map(StatusChangeDTO::fromEntity)
                            .collect(Collectors.toList())
            );
        }

        return dto;
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

    public Integer getUrbanAssetId() {
        return urbanAssetId;
    }

    public void setUrbanAssetId(Integer urbanAssetId) {
        this.urbanAssetId = urbanAssetId;
    }

    public String getUrbanAssetTipo() {
        return urbanAssetTipo;
    }

    public void setUrbanAssetTipo(String urbanAssetTipo) {
        this.urbanAssetTipo = urbanAssetTipo;
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

    public Integer getIdCreador() {
        return idCreador;
    }

    public void setIdCreador(Integer idCreador) {
        this.idCreador = idCreador;
    }

    public String getNombreCreador() {
        return nombreCreador;
    }

    public void setNombreCreador(String nombreCreador) {
        this.nombreCreador = nombreCreador;
    }

    public String getCorreoCreador() {
        return correoCreador;
    }

    public void setCorreoCreador(String correoCreador) {
        this.correoCreador = correoCreador;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<StatusChangeDTO> getHistorial() {
        return historial;
    }

    public void setHistorial(List<StatusChangeDTO> historial) {
        this.historial = historial != null ? historial : new ArrayList<>();
    }
}
