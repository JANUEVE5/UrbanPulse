package com.example.urbanpulse.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class CreateIncidentRequest {

    @NotBlank
    @Size(max = 100)
    private String titulo;

    @NotBlank
    @Size(max = 400)
    private String descripcion;

    @Size(max = 50)
    private String categoria;

    @Pattern(regexp = "Baja|Media|Alta")
    private String prioridad;

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    @Digits(integer = 3, fraction = 6)
    private BigDecimal latitud;

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    @Digits(integer = 3, fraction = 6)
    private BigDecimal longitud;

    private Integer urbanAssetId;

    @Size(max = 200)
    private String localizacion;

    public CreateIncidentRequest() {
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

    public BigDecimal getLatitud() {
        return latitud;
    }

    public void setLatitud(BigDecimal latitud) {
        this.latitud = latitud;
    }

    public BigDecimal getLongitud() {
        return longitud;
    }

    public void setLongitud(BigDecimal longitud) {
        this.longitud = longitud;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public Integer getUrbanAssetId() {
        return urbanAssetId;
    }

    public void setUrbanAssetId(Integer urbanAssetId) {
        this.urbanAssetId = urbanAssetId;
    }

    public String getLocalizacion() {
        return localizacion;
    }

    public void setLocalizacion(String localizacion) {
        this.localizacion = localizacion;
    }
}
