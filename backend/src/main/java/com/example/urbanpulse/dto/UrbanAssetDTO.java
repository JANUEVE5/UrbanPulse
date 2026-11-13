package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.UrbanAsset;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

/**
 * Activo urbano tal como lo devuelve la API. {@code distanciaMetros} y {@code confianza} solo aparecen
 * cuando el activo se ha buscado cerca de un punto ({@code GET /api/urban-assets/nearby}).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UrbanAssetDTO {

    private Integer id;
    private String tipo;
    private String nombre;
    private String descripcion;
    private String direccion;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private String fuente;
    private Integer distanciaMetros;
    private String confianza;

    public UrbanAssetDTO() {
    }

    public static UrbanAssetDTO fromEntity(UrbanAsset asset) {
        if (asset == null) {
            return null;
        }
        UrbanAssetDTO dto = new UrbanAssetDTO();
        dto.setId(asset.getId());
        dto.setTipo(asset.getTipo());
        dto.setNombre(asset.getNombre());
        dto.setDescripcion(asset.getDescripcion());
        dto.setDireccion(asset.getDireccion());
        dto.setLatitud(asset.getLatitud());
        dto.setLongitud(asset.getLongitud());
        dto.setFuente(asset.getFuente());
        return dto;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
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

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }

    public Integer getDistanciaMetros() {
        return distanciaMetros;
    }

    public void setDistanciaMetros(Integer distanciaMetros) {
        this.distanciaMetros = distanciaMetros;
    }

    public String getConfianza() {
        return confianza;
    }

    public void setConfianza(String confianza) {
        this.confianza = confianza;
    }
}
