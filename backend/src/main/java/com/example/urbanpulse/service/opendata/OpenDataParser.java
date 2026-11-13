package com.example.urbanpulse.service.opendata;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Convierte los ficheros de Open Data Málaga en {@link OpenDataAsset}. No accede a la red ni a la base de
 * datos, así que se prueba con ficheros de ejemplo.
 *
 * <p>Los elementos sin identificador o con coordenadas fuera del término municipal se descartan: así un
 * dato erróneo de la fuente no acaba en el mapa.
 */
@Component
public class OpenDataParser {

    /** Recuadro amplio alrededor del término municipal de Málaga, para descartar coordenadas erróneas. */
    static final double LAT_MIN = 36.4;
    static final double LAT_MAX = 37.0;
    static final double LON_MIN = -4.9;
    static final double LON_MAX = -4.1;

    // Nombres de campo que usan las distintas fuentes, por orden de preferencia (sin distinguir mayúsculas)
    private static final List<String> CAMPOS_ID = List.of("ID", "NUMHIDRANTE", "referencia", "ogc_fid", "FID");
    private static final List<String> CAMPOS_NOMBRE = List.of("NOMBRE", "name");
    private static final List<String> CAMPOS_DESCRIPCION = List.of("DESCRIPCION", "description");
    private static final List<String> CAMPOS_DIRECCION = List.of("DIRECCION", "NOMVIALCOMPLETO");

    private static final int MAX_ID = 100;
    private static final int MAX_NOMBRE = 200;
    private static final int MAX_DESCRIPCION = 400;
    private static final int MAX_DIRECCION = 200;

    private final JsonMapper jsonMapper;

    public OpenDataParser(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    public List<OpenDataAsset> parse(OpenDataSource fuente, byte[] contenido) {
        String texto = sinBom(contenido).stripLeading();
        if (texto.startsWith("<")) {
            // Cuando una capa no existe, el servidor de mapas del portal responde con un XML de error
            throw new IllegalArgumentException("el portal devolvió un error en XML en lugar del GeoJSON");
        }
        JsonNode raiz = jsonMapper.readTree(texto);
        return switch (fuente.formato()) {
            case GEOJSON_PUNTOS -> parseGeoJson(fuente, raiz);
            case EMT_LINEAS -> parseEmt(raiz);
        };
    }

    /** GeoJSON {@code FeatureCollection}: un activo por cada {@code Feature} de tipo {@code Point}. */
    private List<OpenDataAsset> parseGeoJson(OpenDataSource fuente, JsonNode raiz) {
        JsonNode features = raiz.path("features");
        if (!features.isArray()) {
            throw new IllegalArgumentException("El fichero no es un GeoJSON FeatureCollection.");
        }
        List<OpenDataAsset> activos = new ArrayList<>();
        for (JsonNode feature : features) {
            JsonNode geometria = feature.path("geometry");
            JsonNode coordenadas = geometria.path("coordinates");
            if (!"Point".equals(geometria.path("type").asString(""))
                    || !coordenadas.isArray() || coordenadas.size() < 2) {
                continue;
            }
            Map<String, JsonNode> propiedades = propiedadesSinMayusculas(feature.path("properties"));
            String id = primero(propiedades, CAMPOS_ID);
            if (id == null) {
                continue;
            }
            String nombre = primero(propiedades, CAMPOS_NOMBRE);
            crear(id,
                    nombre != null ? nombre : fuente.nombre() + " " + id,
                    primero(propiedades, CAMPOS_DESCRIPCION),
                    primero(propiedades, CAMPOS_DIRECCION),
                    coordenadas.get(1).asDouble(),
                    coordenadas.get(0).asDouble())
                    .ifPresent(activos::add);
        }
        return activos;
    }

    /**
     * Formato de la EMT: cada línea trae sus paradas, así que una parada aparece una vez por cada línea que
     * pasa por ella. Se agrupan por {@code codParada} y se guardan las líneas en la descripción.
     */
    private List<OpenDataAsset> parseEmt(JsonNode raiz) {
        if (!raiz.isArray()) {
            throw new IllegalArgumentException("El fichero de la EMT no es una lista de líneas.");
        }
        Map<String, JsonNode> paradas = new LinkedHashMap<>();
        Map<String, Set<String>> lineasPorParada = new LinkedHashMap<>();
        for (JsonNode linea : raiz) {
            String codLinea = texto(linea.path("userCodLinea"));
            for (JsonNode paso : linea.path("paradas")) {
                JsonNode parada = paso.path("parada");
                String codParada = texto(parada.path("codParada"));
                if (codParada == null) {
                    continue;
                }
                paradas.putIfAbsent(codParada, parada);
                Set<String> lineas = lineasPorParada.computeIfAbsent(codParada, c -> new LinkedHashSet<>());
                if (codLinea != null) {
                    lineas.add(codLinea);
                }
            }
        }

        List<OpenDataAsset> activos = new ArrayList<>();
        paradas.forEach((codParada, parada) -> {
            Set<String> lineas = lineasPorParada.get(codParada);
            crear(codParada,
                    texto(parada.path("nombreParada")),
                    lineas.isEmpty() ? null : "Líneas: " + String.join(", ", lineas),
                    texto(parada.path("direccion")),
                    parada.path("latitud").asDouble(Double.NaN),
                    parada.path("longitud").asDouble(Double.NaN))
                    .ifPresent(activos::add);
        });
        return activos;
    }

    private Optional<OpenDataAsset> crear(String id, String nombre, String descripcion, String direccion,
                                                    double latitud, double longitud) {
        if (Double.isNaN(latitud) || Double.isNaN(longitud)
                || latitud < LAT_MIN || latitud > LAT_MAX || longitud < LON_MIN || longitud > LON_MAX) {
            return Optional.empty();
        }
        return Optional.of(new OpenDataAsset(
                recortar(id, MAX_ID),
                recortar(nombre, MAX_NOMBRE),
                recortar(descripcion, MAX_DESCRIPCION),
                recortar(direccion, MAX_DIRECCION),
                // Misma precisión que el resto de coordenadas de la base de datos (NUMERIC(9,6), ADR-010)
                BigDecimal.valueOf(latitud).setScale(6, RoundingMode.HALF_UP),
                BigDecimal.valueOf(longitud).setScale(6, RoundingMode.HALF_UP)));
    }

    private static Map<String, JsonNode> propiedadesSinMayusculas(JsonNode propiedades) {
        Map<String, JsonNode> resultado = new LinkedHashMap<>();
        for (Map.Entry<String, JsonNode> entrada : propiedades.properties()) {
            resultado.putIfAbsent(entrada.getKey().toLowerCase(Locale.ROOT), entrada.getValue());
        }
        return resultado;
    }

    /** El primer campo de la lista que tenga un valor no vacío. */
    private static String primero(Map<String, JsonNode> propiedades, List<String> campos) {
        for (String campo : campos) {
            JsonNode valor = propiedades.get(campo.toLowerCase(Locale.ROOT));
            String texto = valor == null ? null : texto(valor);
            if (texto != null) {
                return texto;
            }
        }
        return null;
    }

    /** Texto limpio del nodo, o {@code null} si no tiene valor. Los números enteros se escriben sin ".0". */
    private static String texto(JsonNode nodo) {
        if (nodo == null || nodo.isNull() || nodo.isMissingNode() || nodo.isContainer()) {
            return null;
        }
        String texto = nodo.isNumber() && nodo.canConvertToExactIntegral()
                ? nodo.bigIntegerValue().toString()
                : nodo.asString();
        texto = texto.trim().replaceAll("\\s+", " ");
        return texto.isEmpty() ? null : texto;
    }

    private static String recortar(String texto, int maximo) {
        return texto == null || texto.length() <= maximo ? texto : texto.substring(0, maximo);
    }

    /** Algunos ficheros del portal empiezan con la marca de orden de bytes de UTF-8, que Jackson no acepta. */
    private static String sinBom(byte[] contenido) {
        String texto = new String(contenido, StandardCharsets.UTF_8);
        return texto.startsWith("﻿") ? texto.substring(1) : texto;
    }
}
