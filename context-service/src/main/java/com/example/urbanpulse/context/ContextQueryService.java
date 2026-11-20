package com.example.urbanpulse.context;

import com.example.urbanpulse.context.asset.UrbanAssetService;
import com.example.urbanpulse.context.resilience.ProviderCircuitBreaker;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContextQueryService {
    private final JdbcTemplate jdbc;
    private final UrbanAssetService assets;
    private final ProviderCircuitBreaker breaker;

    public ContextQueryService(JdbcTemplate jdbc, UrbanAssetService assets, ProviderCircuitBreaker breaker) {
        this.jdbc = jdbc;
        this.assets = assets;
        this.breaker = breaker;
    }

    public ContextResponse getContext(BigDecimal latitude, BigDecimal longitude) {
        List<UrbanAssetService.Asset> nearby = assets.nearby(latitude, longitude, 200);
        WeatherObservation observation = jdbc.query("""
                        SELECT municipio, estacion, temperatura, humedad, estado_cielo, viento,
                               precipitacion, observado_en, ingerido_en, fuente, calidad
                        FROM "WeatherObservation" ORDER BY observado_en DESC LIMIT 1
                        """, (rs, row) -> new WeatherObservation(rs.getString("municipio"), rs.getString("estacion"),
                rs.getBigDecimal("temperatura"), rs.getBigDecimal("humedad"), rs.getString("estado_cielo"),
                rs.getString("viento"), rs.getBigDecimal("precipitacion"),
                rs.getTimestamp("observado_en").toLocalDateTime(), rs.getTimestamp("ingerido_en").toLocalDateTime(),
                rs.getString("fuente"), rs.getString("calidad"))).stream().findFirst().orElse(null);
        List<WeatherForecast> forecast = jdbc.query("""
                        SELECT municipio, fecha, temperatura_min, temperatura_max, humedad, estado_cielo,
                               probabilidad_precipitacion, actualizado_en, fuente
                        FROM "WeatherForecast" WHERE fecha >= ? ORDER BY fecha LIMIT 7
                        """, (rs, row) -> new WeatherForecast(rs.getString("municipio"),
                rs.getDate("fecha").toLocalDate(), rs.getBigDecimal("temperatura_min"),
                rs.getBigDecimal("temperatura_max"), rs.getBigDecimal("humedad"), rs.getString("estado_cielo"),
                rs.getBigDecimal("probabilidad_precipitacion"), rs.getTimestamp("actualizado_en").toLocalDateTime(),
                rs.getString("fuente")), LocalDate.now());

        boolean weatherDegraded = observation == null
                || observation.observadoEn().isBefore(LocalDateTime.now().minusHours(6))
                || breaker.getState("aemet") == ProviderCircuitBreaker.State.OPEN;
        LocalDateTime latestAsset = jdbc.queryForObject(
                "SELECT MAX(actualizado_en) FROM \"UrbanAsset\"", LocalDateTime.class);
        boolean openDataDegraded = latestAsset == null
                || latestAsset.isBefore(LocalDateTime.now().minusHours(36))
                || breaker.getState("opendata") == ProviderCircuitBreaker.State.OPEN;
        return new ContextResponse(latitude, longitude, nearby, observation, forecast,
                breaker.getState("opendata").name(), breaker.getState("aemet").name(),
                weatherDegraded || openDataDegraded, observation == null ? null : observation.observadoEn());
    }

    public List<UrbanAssetService.Asset> nearbyAssets(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        return assets.nearby(latitude, longitude, radiusMeters);
    }

    public List<UrbanAssetService.Asset> allAssets() {
        return assets.all();
    }

    public record ContextResponse(BigDecimal lat, BigDecimal lon, List<UrbanAssetService.Asset> activosCercanos,
                                  WeatherObservation meteorologiaActual, List<WeatherForecast> prediccion,
                                  String estadoOpenData, String estadoAemet, boolean degradado,
                                  LocalDateTime ultimaObservacion) {
    }

    public record WeatherObservation(String municipio, String estacion, BigDecimal temperaturaCelsius,
                                     BigDecimal humedadPorcentaje, String estadoCielo, String viento,
                                     BigDecimal precipitacionMm, LocalDateTime observadoEn,
                                     LocalDateTime ingeridoEn, String fuente, String calidad) {
    }

    public record WeatherForecast(String municipio, LocalDate fecha, BigDecimal temperaturaMinimaCelsius,
                                  BigDecimal temperaturaMaximaCelsius, BigDecimal humedadPorcentaje,
                                  String estadoCielo, BigDecimal probabilidadPrecipitacionPorcentaje,
                                  LocalDateTime actualizadoEn, String fuente) {
    }
}
