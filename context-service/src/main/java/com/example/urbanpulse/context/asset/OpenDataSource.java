package com.example.urbanpulse.context.asset;

public record OpenDataSource(String codigo, String tipo, String nombre, String ruta, Formato formato) {

    public enum Formato {
        GEOJSON_PUNTOS,
        EMT_LINEAS
    }
}
