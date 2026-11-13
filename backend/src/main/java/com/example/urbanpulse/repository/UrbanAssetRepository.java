package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.UrbanAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface UrbanAssetRepository extends JpaRepository<UrbanAsset, Integer> {

    /** Activos dentro de un recuadro de latitud y longitud (usa el índice idx_urban_asset_posicion). */
    List<UrbanAsset> findByLatitudBetweenAndLongitudBetween(
            BigDecimal latitudMin, BigDecimal latitudMax, BigDecimal longitudMin, BigDecimal longitudMax);
}
