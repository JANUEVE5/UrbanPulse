package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.UrbanAssetDTO;
import com.example.urbanpulse.entity.UrbanAsset;

import java.math.BigDecimal;
import java.util.List;

public interface UrbanAssetService {

    /** Radio por defecto y máximo de la búsqueda de activos cercanos, en metros. */
    int RADIO_POR_DEFECTO_METROS = 50;
    int RADIO_MAXIMO_METROS = 200;

    /** Número máximo de candidatos que se devuelven. */
    int MAXIMO_CANDIDATOS = 10;

    /**
     * Activos a menos de {@code radioMetros} del punto, del más cercano al más lejano, con su distancia y
     * un nivel de confianza de la asociación (RF22).
     */
    List<UrbanAssetDTO> findNearby(BigDecimal latitud, BigDecimal longitud, int radioMetros);

    /**
     * Comprueba que el activo existe y está a menos de {@link #RADIO_MAXIMO_METROS} de la incidencia.
     *
     * @throws org.springframework.web.server.ResponseStatusException 400 si no existe o está demasiado lejos
     */
    UrbanAsset getAssetNear(Integer assetId, BigDecimal latitud, BigDecimal longitud);
}
