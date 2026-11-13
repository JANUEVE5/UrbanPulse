package com.example.urbanpulse.service.impl;

import com.example.urbanpulse.dto.UrbanAssetDTO;
import com.example.urbanpulse.entity.UrbanAsset;
import com.example.urbanpulse.repository.UrbanAssetRepository;
import com.example.urbanpulse.service.GeoDistance;
import com.example.urbanpulse.service.UrbanAssetService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class UrbanAssetServiceImpl implements UrbanAssetService {

    /** Hasta esta distancia (m) la asociación es muy probable; a partir de la siguiente, dudosa. */
    static final int CONFIANZA_ALTA_METROS = 15;
    static final int CONFIANZA_MEDIA_METROS = 40;

    private final UrbanAssetRepository urbanAssetRepository;

    public UrbanAssetServiceImpl(UrbanAssetRepository urbanAssetRepository) {
        this.urbanAssetRepository = urbanAssetRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UrbanAssetDTO> findNearby(BigDecimal latitud, BigDecimal longitud, int radioMetros) {
        // 1. Recuadro alrededor del punto (barato, usa el índice); 2. distancia real y filtro por radio
        double margenLatitud = radioMetros / GeoDistance.METROS_POR_GRADO_LATITUD;
        double margenLongitud = radioMetros
                / (GeoDistance.METROS_POR_GRADO_LATITUD * Math.cos(Math.toRadians(latitud.doubleValue())));

        return urbanAssetRepository.findByLatitudBetweenAndLongitudBetween(
                        desplazar(latitud, -margenLatitud), desplazar(latitud, margenLatitud),
                        desplazar(longitud, -margenLongitud), desplazar(longitud, margenLongitud))
                .stream()
                .map(asset -> conDistancia(asset,
                        GeoDistance.metros(latitud, longitud, asset.getLatitud(), asset.getLongitud())))
                .filter(dto -> dto.getDistanciaMetros() <= radioMetros)
                .sorted(Comparator.comparingInt(UrbanAssetDTO::getDistanciaMetros))
                .limit(MAXIMO_CANDIDATOS)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UrbanAsset getAssetNear(Integer assetId, BigDecimal latitud, BigDecimal longitud) {
        UrbanAsset asset = urbanAssetRepository.findById(assetId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No existe el activo urbano con identificador " + assetId + "."));
        if (latitud != null && longitud != null
                && GeoDistance.metros(latitud, longitud, asset.getLatitud(), asset.getLongitud()) > RADIO_MAXIMO_METROS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El activo urbano está a más de " + RADIO_MAXIMO_METROS + " m de la incidencia.");
        }
        return asset;
    }

    static String confianza(int distanciaMetros) {
        if (distanciaMetros <= CONFIANZA_ALTA_METROS) {
            return "Alta";
        }
        return distanciaMetros <= CONFIANZA_MEDIA_METROS ? "Media" : "Baja";
    }

    private static UrbanAssetDTO conDistancia(UrbanAsset asset, double metros) {
        UrbanAssetDTO dto = UrbanAssetDTO.fromEntity(asset);
        int distancia = (int) Math.round(metros);
        dto.setDistanciaMetros(distancia);
        dto.setConfianza(confianza(distancia));
        return dto;
    }

    private static BigDecimal desplazar(BigDecimal valor, double grados) {
        return valor.add(BigDecimal.valueOf(grados)).setScale(6, RoundingMode.HALF_UP);
    }
}
