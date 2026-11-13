package com.example.urbanpulse.controller;

import com.example.urbanpulse.dto.UrbanAssetDTO;
import com.example.urbanpulse.service.UrbanAssetService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/** Activos urbanos sincronizados desde Open Data Málaga (RF22, ADR-015). Requiere estar autenticado. */
@RestController
@RequestMapping("/api/urban-assets")
public class UrbanAssetController {

    private final UrbanAssetService urbanAssetService;

    public UrbanAssetController(UrbanAssetService urbanAssetService) {
        this.urbanAssetService = urbanAssetService;
    }

    /** Candidatos para asociar a una incidencia en ese punto, del más cercano al más lejano. */
    @GetMapping("/nearby")
    public ResponseEntity<List<UrbanAssetDTO>> findNearby(
            @RequestParam @DecimalMin("-90") @DecimalMax("90") BigDecimal latitud,
            @RequestParam @DecimalMin("-180") @DecimalMax("180") BigDecimal longitud,
            @RequestParam(defaultValue = "" + UrbanAssetService.RADIO_POR_DEFECTO_METROS)
            @Min(1) @Max(UrbanAssetService.RADIO_MAXIMO_METROS) int radio) {
        return ResponseEntity.ok(urbanAssetService.findNearby(latitud, longitud, radio));
    }
}
