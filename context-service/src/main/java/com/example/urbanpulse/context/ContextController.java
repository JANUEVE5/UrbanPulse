package com.example.urbanpulse.context;

import com.example.urbanpulse.context.asset.UrbanAssetService;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@Validated
@RequestMapping("/api")
public class ContextController {
    private final ContextQueryService queryService;

    public ContextController(ContextQueryService queryService) {
        this.queryService = queryService;
    }

    @GetMapping("/context")
    public ContextQueryService.ContextResponse context(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal lat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal lon) {
        return queryService.getContext(lat, lon);
    }

    @GetMapping("/urban-assets/nearby")
    public java.util.List<UrbanAssetService.Asset> nearby(
            @RequestParam BigDecimal latitud,
            @RequestParam BigDecimal longitud,
            @RequestParam(defaultValue = "50") int radio) {
        if (latitud.compareTo(BigDecimal.valueOf(-90)) < 0 || latitud.compareTo(BigDecimal.valueOf(90)) > 0
                || longitud.compareTo(BigDecimal.valueOf(-180)) < 0
                || longitud.compareTo(BigDecimal.valueOf(180)) > 0 || radio < 1 || radio > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordenadas o radio fuera de rango");
        }
        return queryService.nearbyAssets(latitud, longitud, radio);
    }

    @GetMapping("/urban-assets/export")
    public java.util.List<UrbanAssetService.Asset> exportAssets() {
        return queryService.allAssets();
    }
}
