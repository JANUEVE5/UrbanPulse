package com.example.urbanpulse.dto;

import com.example.urbanpulse.entity.UrbanAsset;

import java.math.BigDecimal;

/**
 * DTO para transferir información de un activo urbano (ej. parada de autobús EMT, farola, etc.).
 */
public class UrbanAssetDTO {

    private Integer id;
    private String tipo;
    private String nombre;
    private BigDecimal latitud;
    private BigDecimal longitud;
    private String fuente;
    private String metadatos;

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
        dto.setLatitud(asset.getLatitud());
        dto.setLongitud(asset.getLongitud());
        dto.setFuente(asset.getFuente());
        dto.setMetadatos(asset.getMetadatos());
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

    public String getMetadatos() {
        return metadatos;
    }

    public void setMetadatos(String metadatos) {
        this.metadatos = metadatos;
    }
}

