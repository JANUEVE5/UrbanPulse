package com.example.urbanpulse.context;

import com.example.urbanpulse.context.resilience.ProviderCircuitBreaker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class ContextCachePersistenceTest {
    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ContextQueryService contextQuery;

    @Autowired
    private ProviderCircuitBreaker breaker;

    @BeforeEach
    void resetCache() {
        jdbc.update("DELETE FROM \"WeatherForecast\"");
        jdbc.update("DELETE FROM \"WeatherObservation\"");
        jdbc.update("DELETE FROM \"UrbanAsset\"");
        jdbc.update("""
                INSERT INTO "UrbanAsset"
                    (tipo, nombre, latitud, longitud, fuente, id_externo, actualizado_en)
                VALUES ('SEMAFORO', 'Semáforo de prueba', 36.720000, -4.420000,
                        'test', 'asset-1', CURRENT_TIMESTAMP)
                """);
        jdbc.update("""
                INSERT INTO "WeatherObservation"
                    (municipio, estacion, temperatura, humedad, observado_en, ingerido_en, fuente, calidad)
                VALUES ('Málaga', '6156X', 22.0, 55.0, ?, CURRENT_TIMESTAMP, 'AEMET', 'OBSERVED')
                """, Timestamp.valueOf(LocalDateTime.now().minusHours(1)));
        jdbc.update("""
                INSERT INTO "WeatherForecast"
                    (municipio, fecha, temperatura_min, temperatura_max, fuente)
                VALUES ('Málaga', ?, 17.0, 26.0, 'AEMET')
                """, LocalDate.now().plusDays(1));
    }

    @Test
    void servesPersistedContextWhileAemetCircuitIsOpen() throws Exception {
        for (int failure = 0; failure < 3; failure++) {
            try {
                breaker.call("aemet", () -> {
                    throw new IOException("provider unavailable");
                });
            } catch (IOException expected) {
                assertEquals("provider unavailable", expected.getMessage());
            }
        }

        ContextQueryService.ContextResponse response = contextQuery.getContext(
                new BigDecimal("36.72"), new BigDecimal("-4.42"));

        assertTrue(response.degradado());
        assertEquals(ProviderCircuitBreaker.State.OPEN.name(), response.estadoAemet());
        assertEquals(1, response.activosCercanos().size());
        assertNotNull(response.meteorologiaActual());
        assertEquals(new BigDecimal("22.0"), response.meteorologiaActual().temperaturaCelsius());
        assertEquals(1, response.prediccion().size());
    }
}
