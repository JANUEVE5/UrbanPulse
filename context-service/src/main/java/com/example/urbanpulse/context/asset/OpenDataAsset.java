package com.example.urbanpulse.context.asset;

import java.math.BigDecimal;

public record OpenDataAsset(
        String idExterno,
        String nombre,
        String descripcion,
        String direccion,
        BigDecimal latitud,
        BigDecimal longitud) {
}
