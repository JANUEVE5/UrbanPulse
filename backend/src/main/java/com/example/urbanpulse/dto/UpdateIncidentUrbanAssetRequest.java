package com.example.urbanpulse.dto;

/**
 * Cambio del activo urbano asociado a una incidencia (RF22). {@code urbanAssetId = null} quita la
 * asociación.
 */
public class UpdateIncidentUrbanAssetRequest {

    private Integer urbanAssetId;

    public Integer getUrbanAssetId() {
        return urbanAssetId;
    }

    public void setUrbanAssetId(Integer urbanAssetId) {
        this.urbanAssetId = urbanAssetId;
    }
}
