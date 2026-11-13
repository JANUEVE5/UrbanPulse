package com.example.urbanpulse.service;

import java.math.BigDecimal;

/** Cálculos de distancia entre coordenadas EPSG:4326 (ADR-010). */
public final class GeoDistance {

    private static final double RADIO_TIERRA_METROS = 6_371_000;

    /** Metros que mide un grado de latitud (aproximadamente constante). */
    public static final double METROS_POR_GRADO_LATITUD = 111_320;

    private GeoDistance() {
    }

    /** Distancia en metros entre dos puntos (fórmula del semiverseno o haversine). */
    public static double metros(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        double phi1 = Math.toRadians(lat1.doubleValue());
        double phi2 = Math.toRadians(lat2.doubleValue());
        double dPhi = phi2 - phi1;
        double dLambda = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());
        double a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2)
                + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
        return 2 * RADIO_TIERRA_METROS * Math.asin(Math.min(1, Math.sqrt(a)));
    }
}
