package com.example.urbanpulse.repository;

import com.example.urbanpulse.entity.UrbanAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UrbanAssetRepository extends JpaRepository<UrbanAsset, Integer> {
}

