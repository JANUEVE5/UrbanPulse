package com.example.urbanpulse.context.asset;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
public class UrbanAssetService {
    private final JdbcTemplate jdbc;

    public UrbanAssetService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Asset> nearby(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        double lat = latitude.doubleValue();
        double lon = longitude.doubleValue();
        double latMargin = radiusMeters / 111_320d;
        double lonMargin = radiusMeters / (111_320d * Math.max(0.01d, Math.cos(Math.toRadians(lat))));
        return jdbc.query("""
                        SELECT id, tipo, nombre, descripcion, direccion, latitud, longitud, fuente, id_externo,
                               actualizado_en
                        FROM "UrbanAsset"
                        WHERE latitud BETWEEN ? AND ? AND longitud BETWEEN ? AND ?
                        """, (rs, row) -> {
                    Asset asset = new Asset(rs.getLong("id"), rs.getString("tipo"), rs.getString("nombre"),
                            rs.getString("descripcion"), rs.getString("direccion"), rs.getBigDecimal("latitud"),
                            rs.getBigDecimal("longitud"), rs.getString("fuente"), rs.getString("id_externo"),
                            rs.getTimestamp("actualizado_en").toLocalDateTime());
                    int distance = (int) Math.round(distanceMeters(lat, lon,
                            asset.latitud().doubleValue(), asset.longitud().doubleValue()));
                    return asset.withDistance(distance, confidence(distance));
                }, latitude.doubleValue() - latMargin, latitude.doubleValue() + latMargin,
                longitude.doubleValue() - lonMargin, longitude.doubleValue() + lonMargin)
                .stream().filter(asset -> asset.distanciaMetros() <= radiusMeters)
                .sorted(Comparator.comparingInt(Asset::distanciaMetros)).limit(10).toList();
    }

    public List<Asset> all() {
        return jdbc.query("""
                        SELECT id, tipo, nombre, descripcion, direccion, latitud, longitud, fuente, id_externo,
                               actualizado_en
                        FROM "UrbanAsset" ORDER BY id
                        """, (rs, row) -> new Asset(rs.getLong("id"), rs.getString("tipo"), rs.getString("nombre"),
                rs.getString("descripcion"), rs.getString("direccion"), rs.getBigDecimal("latitud"),
                rs.getBigDecimal("longitud"), rs.getString("fuente"), rs.getString("id_externo"),
                rs.getTimestamp("actualizado_en").toLocalDateTime()));
    }

    private static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static String confidence(int distance) {
        if (distance <= 15) {
            return "Alta";
        }
        return distance <= 40 ? "Media" : "Baja";
    }

    public record Asset(long id, String tipo, String nombre, String descripcion, String direccion,
                        BigDecimal latitud, BigDecimal longitud, String fuente, String idExterno,
                        java.time.LocalDateTime actualizadoEn, int distanciaMetros, String confianza) {
        public Asset(long id, String tipo, String nombre, String descripcion, String direccion,
                     BigDecimal latitud, BigDecimal longitud, String fuente, String idExterno,
                     java.time.LocalDateTime actualizadoEn) {
            this(id, tipo, nombre, descripcion, direccion, latitud, longitud, fuente, idExterno, actualizadoEn, 0, null);
        }

        private Asset withDistance(int distance, String confidence) {
            return new Asset(id, tipo, nombre, descripcion, direccion, latitud, longitud, fuente, idExterno,
                    actualizadoEn, distance, confidence);
        }
    }
}
