package com.example.urbanpulse.context.weather;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;
import tools.jackson.databind.JsonNode;
import com.example.urbanpulse.context.resilience.ProviderCircuitBreaker;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Service
public class WeatherSyncService {
    private static final Logger log = LoggerFactory.getLogger(WeatherSyncService.class);
    private static final String UPSERT_OBSERVATION = """
            INSERT INTO "WeatherObservation"
                (municipio, estacion, temperatura, humedad, estado_cielo, viento, precipitacion,
                 observado_en, ingerido_en, fuente, calidad)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'AEMET', 'OBSERVED')
            ON CONFLICT (fuente, estacion, observado_en) DO UPDATE SET
                temperatura = EXCLUDED.temperatura, humedad = EXCLUDED.humedad,
                estado_cielo = EXCLUDED.estado_cielo, viento = EXCLUDED.viento,
                precipitacion = EXCLUDED.precipitacion, ingerido_en = CURRENT_TIMESTAMP
            """;

    private final AemetClient client;
    private final JdbcTemplate jdbc;
    private final ProviderCircuitBreaker breaker;
    private final TransactionOperations transactions;

    public WeatherSyncService(AemetClient client, JdbcTemplate jdbc, ProviderCircuitBreaker breaker,
                              TransactionOperations transactions) {
        this.client = client;
        this.jdbc = jdbc;
        this.breaker = breaker;
        this.transactions = transactions;
    }

    public void sincronizar() {
        try {
            breaker.call("aemet", () -> {
                JsonNode observations = client.getStationObservation();
                JsonNode forecast = client.getMunicipalityForecast();
                transactions.executeWithoutResult(status -> {
                    guardarObservaciones(observations);
                    guardarPrediccion(forecast);
                });
                return null;
            });
        } catch (Exception exception) {
            log.warn("No se pudo actualizar AEMET; se conserva la última observación almacenada: {}",
                    exception.getMessage());
        }
    }

    private void guardarObservaciones(JsonNode root) {
        JsonNode rows = root.isArray() ? root : root.path("datos");
        if (!rows.isArray()) {
            throw new IllegalArgumentException("La respuesta de observaciones AEMET no es una lista");
        }
        int saved = 0;
        for (JsonNode row : rows) {
            String station = text(row, "idema");
            String observed = text(row, "fint");
            BigDecimal temperature = decimal(row, "ta");
            BigDecimal humidity = decimal(row, "hr");
            if (station == null || observed == null || temperature == null || humidity == null) {
                continue;
            }
            LocalDateTime observedAt = parseDateTime(observed);
            jdbc.update(UPSERT_OBSERVATION, "Málaga", station, temperature, humidity,
                    text(row, "estado_cielo"), text(row, "vv"), decimal(row, "prec"),
                    Timestamp.valueOf(observedAt));
            saved++;
        }
        if (saved == 0) {
            throw new IllegalArgumentException("AEMET no devolvió observaciones utilizables de la estación");
        }
    }

    private void guardarPrediccion(JsonNode root) {
        JsonNode forecast = root.isArray() && !root.isEmpty() ? root.get(0) : root;
        JsonNode days = forecast.path("prediccion").path("dia");
        if (!days.isArray()) {
            throw new IllegalArgumentException("La predicción AEMET no contiene días");
        }
        int saved = 0;
        for (JsonNode day : days) {
            String date = text(day, "fecha");
            if (date == null) {
                continue;
            }
            JsonNode temperature = day.path("temperatura");
            JsonNode humidity = day.path("humedadRelativa");
            JsonNode sky = day.path("estadoCielo");
            JsonNode precipitation = day.path("probPrecipitacion");
            jdbc.update("""
                    INSERT INTO "WeatherForecast"
                        (municipio, fecha, temperatura_min, temperatura_max, humedad, estado_cielo,
                         probabilidad_precipitacion, actualizado_en, fuente)
                    VALUES ('Málaga', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'AEMET')
                    ON CONFLICT (municipio, fecha, fuente) DO UPDATE SET
                        temperatura_min = EXCLUDED.temperatura_min,
                        temperatura_max = EXCLUDED.temperatura_max,
                        humedad = EXCLUDED.humedad, estado_cielo = EXCLUDED.estado_cielo,
                        probabilidad_precipitacion = EXCLUDED.probabilidad_precipitacion,
                        actualizado_en = CURRENT_TIMESTAMP
                    """, LocalDate.parse(date), decimal(temperature, "minima"), decimal(temperature, "maxima"),
                    firstValue(humidity), firstText(sky), firstValue(precipitation));
            saved++;
        }
        if (saved == 0) {
            throw new IllegalArgumentException("AEMET no devolvió días de predicción utilizables");
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asString(value.toString());
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        String value = text(node, field);
        if (value == null || value.isBlank() || "Ip".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return new BigDecimal(value.replace(',', '.'));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static BigDecimal firstValue(JsonNode values) {
        return values.isArray() && !values.isEmpty() ? decimal(values.get(0), "value") : null;
    }

    private static String firstText(JsonNode values) {
        if (!values.isArray()) {
            return null;
        }
        for (JsonNode value : values) {
            String description = text(value, "descripcion");
            if (description != null && !description.isBlank()) {
                return description;
            }
        }
        return null;
    }

    private static LocalDateTime parseDateTime(String value) {
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.parse(value);
        }
    }
}
