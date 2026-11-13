package com.example.urbanpulse.service.opendata;

/**
 * Una fuente de Open Data Málaga de la que se cargan activos urbanos.
 *
 * @param codigo  identificador estable de la fuente; se guarda en {@code "UrbanAsset".fuente}
 * @param tipo    código del tipo de activo que aporta (por ejemplo {@code DESFIBRILADOR})
 * @param nombre  nombre legible, para los logs y para nombrar activos que no traen nombre propio
 * @param ruta    ruta del fichero dentro del portal (se añade a {@code OPENDATA_BASE_URL})
 * @param formato cómo se interpreta el fichero
 */
public record OpenDataSource(String codigo, String tipo, String nombre, String ruta, Formato formato) {

    public enum Formato {
        /** GeoJSON {@code FeatureCollection} con puntos en EPSG:4326 (el formato habitual del portal). */
        GEOJSON_PUNTOS,
        /** JSON propio de la EMT: una lista de líneas, cada una con sus paradas. */
        EMT_LINEAS
    }
}
