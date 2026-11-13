package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.UrbanAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UrbanAssetRepository extends JpaRepository<UrbanAsset, Integer> {

    List<UrbanAsset> findByTipo(String tipo);

    Optional<UrbanAsset> findByTipoAndNombre(String tipo, String nombre);
}
