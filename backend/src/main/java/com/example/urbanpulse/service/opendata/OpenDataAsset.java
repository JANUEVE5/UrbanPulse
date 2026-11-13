package com.example.urbanpulse.service.opendata;

import java.math.BigDecimal;

/** Un activo leído de una fuente de Open Data, antes de guardarlo. Las coordenadas ya están en EPSG:4326. */
public record OpenDataAsset(
        String idExterno,
        String nombre,
        String descripcion,
        String direccion,
        BigDecimal latitud,
        BigDecimal longitud) {
}
