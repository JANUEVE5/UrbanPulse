package com.example.urbanpulse.service;

import com.example.urbanpulse.dto.UrbanAssetDTO;
import com.example.urbanpulse.entity.UrbanAsset;
import com.example.urbanpulse.repository.UrbanAssetRepository;
import com.example.urbanpulse.service.impl.UrbanAssetServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrbanAssetServiceImplTest {

    // Punto de referencia: Plaza de la Marina (Málaga)
    private static final BigDecimal LAT = new BigDecimal("36.718700");
    private static final BigDecimal LON = new BigDecimal("-4.420800");

    @Mock
    private UrbanAssetRepository urbanAssetRepository;

    @InjectMocks
    private UrbanAssetServiceImpl urbanAssetService;

    /** Activo desplazado {@code metrosNorte} metros al norte del punto de referencia. */
    private static UrbanAsset activoAlNorte(int id, String tipo, double metrosNorte) {
        UrbanAsset asset = new UrbanAsset(id, tipo);
        asset.setNombre(tipo + " " + id);
        asset.setLatitud(LAT.add(BigDecimal.valueOf(metrosNorte / GeoDistance.METROS_POR_GRADO_LATITUD))
                .setScale(6, java.math.RoundingMode.HALF_UP));
        asset.setLongitud(LON);
        return asset;
    }

    @Test
    @DisplayName("findNearby devuelve solo los activos dentro del radio, del más cercano al más lejano")
    void findNearbyFiltersAndSorts() {
        when(urbanAssetRepository.findByLatitudBetweenAndLongitudBetween(any(), any(), any(), any()))
                .thenReturn(List.of(
                        activoAlNorte(1, "CONTENEDOR_VIDRIO", 35),
                        activoAlNorte(2, "PARADA_AUTOBUS", 8),
                        activoAlNorte(3, "SEMAFORO", 49),
                        // El recuadro incluye las esquinas, que están más lejos que el radio
                        activoAlNorte(4, "HIDRANTE", 70)));

        List<UrbanAssetDTO> cercanos = urbanAssetService.findNearby(LAT, LON, 50);

        assertEquals(List.of(2, 1, 3), cercanos.stream().map(UrbanAssetDTO::getId).toList());
        assertEquals("Alta", cercanos.get(0).getConfianza());
        assertEquals("Media", cercanos.get(1).getConfianza());
        assertEquals("Baja", cercanos.get(2).getConfianza());
        assertTrue(Math.abs(cercanos.get(0).getDistanciaMetros() - 8) <= 1);
    }

    @Test
    @DisplayName("findNearby devuelve como mucho 10 candidatos")
    void findNearbyLimitsResults() {
        List<UrbanAsset> muchos = java.util.stream.IntStream.range(0, 15)
                .mapToObj(i -> activoAlNorte(i, "APARCAMIENTO_MOTO", i))
                .toList();
        when(urbanAssetRepository.findByLatitudBetweenAndLongitudBetween(any(), any(), any(), any()))
                .thenReturn(muchos);

        assertEquals(UrbanAssetService.MAXIMO_CANDIDATOS, urbanAssetService.findNearby(LAT, LON, 50).size());
    }

    @Test
    @DisplayName("getAssetNear devuelve el activo si está a menos de 200 m")
    void getAssetNearReturnsCloseAsset() {
        UrbanAsset parada = activoAlNorte(5, "PARADA_AUTOBUS", 120);
        when(urbanAssetRepository.findById(5)).thenReturn(Optional.of(parada));

        assertSame(parada, urbanAssetService.getAssetNear(5, LAT, LON));
    }

    @Test
    @DisplayName("getAssetNear rechaza con 400 un activo lejano o inexistente")
    void getAssetNearRejectsFarOrMissingAsset() {
        when(urbanAssetRepository.findById(6)).thenReturn(Optional.of(activoAlNorte(6, "HIDRANTE", 500)));
        when(urbanAssetRepository.findById(7)).thenReturn(Optional.empty());

        ResponseStatusException lejos = assertThrows(ResponseStatusException.class,
                () -> urbanAssetService.getAssetNear(6, LAT, LON));
        ResponseStatusException noExiste = assertThrows(ResponseStatusException.class,
                () -> urbanAssetService.getAssetNear(7, LAT, LON));

        assertEquals(HttpStatus.BAD_REQUEST, lejos.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, noExiste.getStatusCode());
    }
}
