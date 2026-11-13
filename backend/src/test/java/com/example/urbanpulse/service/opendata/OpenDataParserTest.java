package com.example.urbanpulse.service.opendata;

import com.example.urbanpulse.service.opendata.OpenDataSource.Formato;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenDataParserTest {

    private static final OpenDataSource SEMAFOROS =
            new OpenDataSource("semaforos", "SEMAFORO", "Semáforo acústico", "/s.geojson", Formato.GEOJSON_PUNTOS);
    private static final OpenDataSource HIDRANTES =
            new OpenDataSource("hidrantes", "HIDRANTE", "Hidrante", "/h.geojson", Formato.GEOJSON_PUNTOS);
    private static final OpenDataSource EMT =
            new OpenDataSource("emt-paradas", "PARADA_AUTOBUS", "Parada", "/emt.geojson", Formato.EMT_LINEAS);

    private final OpenDataParser parser = new OpenDataParser(JsonMapper.builder().build());

    private List<OpenDataAsset> parse(OpenDataSource fuente, String json) {
        return parser.parse(fuente, json.getBytes(StandardCharsets.UTF_8));
    }

    private static String feature(String propiedades, String geometria) {
        return "{\"type\":\"Feature\",\"geometry\":" + geometria + ",\"properties\":" + propiedades + "}";
    }

    private static String coleccion(String... features) {
        return "{\"type\":\"FeatureCollection\",\"features\":[" + String.join(",", features) + "]}";
    }

    @Test
    @DisplayName("GeoJSON del portal: lee id, nombre, descripción, dirección y coordenadas [lon, lat]")
    void parseStandardGeoJson() {
        String json = coleccion(feature(
                "{\"ID\":19120,\"NOMBRE\":\"SEMAFOROACUSTICO_07.04\",\"DESCRIPCION\":\"Intersección con Plaza de Toros Vieja\","
                        + "\"DIRECCION\":\"CALLE CUARTELES,  42 \"}",
                "{\"type\":\"Point\",\"coordinates\":[-4.4271234567,36.7135]}"));

        List<OpenDataAsset> activos = parse(SEMAFOROS, json);

        assertEquals(1, activos.size());
        OpenDataAsset activo = activos.get(0);
        assertEquals("19120", activo.idExterno());
        assertEquals("SEMAFOROACUSTICO_07.04", activo.nombre());
        assertEquals("Intersección con Plaza de Toros Vieja", activo.descripcion());
        assertEquals("CALLE CUARTELES, 42", activo.direccion());
        assertEquals(new BigDecimal("36.713500"), activo.latitud());
        assertEquals(new BigDecimal("-4.427123"), activo.longitud());
    }

    @Test
    @DisplayName("GeoJSON con otros nombres de campo y sin nombre: usa el nombre de la fuente y el id")
    void parseGeoJsonWithAlternativeFields() {
        String json = "﻿" + coleccion(feature(
                "{\"NUMHIDRANTE\":689,\"NOMVIALCOMPLETO\":\"CALLE DEL VOLUNTARIADO MALAGUEÑO\"}",
                "{\"type\":\"Point\",\"coordinates\":[-4.45,36.72]}"));

        OpenDataAsset activo = parse(HIDRANTES, json).get(0);

        assertEquals("689", activo.idExterno());
        assertEquals("Hidrante 689", activo.nombre());
        assertNull(activo.descripcion());
        assertEquals("CALLE DEL VOLUNTARIADO MALAGUEÑO", activo.direccion());
    }

    @Test
    @DisplayName("GeoJSON: descarta elementos sin id, que no son puntos o fuera de Málaga")
    void parseGeoJsonSkipsInvalidFeatures() {
        String punto = "{\"type\":\"Point\",\"coordinates\":[-4.42,36.72]}";
        String json = coleccion(
                feature("{\"NOMBRE\":\"sin id\"}", punto),
                feature("{\"ID\":1}", "{\"type\":\"LineString\",\"coordinates\":[[-4.42,36.72],[-4.43,36.73]]}"),
                feature("{\"ID\":2}", "{\"type\":\"Point\",\"coordinates\":[-3.70,40.41]}"),
                feature("{\"ID\":3}", "null"),
                feature("{\"ID\":4}", punto));

        List<OpenDataAsset> activos = parse(SEMAFOROS, json);

        assertEquals(1, activos.size());
        assertEquals("4", activos.get(0).idExterno());
    }

    @Test
    @DisplayName("GeoJSON vacío: no hay activos")
    void parseEmptyGeoJson() {
        assertTrue(parse(SEMAFOROS, coleccion()).isEmpty());
    }

    @Test
    @DisplayName("Un fichero que no es GeoJSON da error (la sincronización conserva los datos anteriores)")
    void parseInvalidGeoJson() {
        assertThrows(IllegalArgumentException.class, () -> parse(SEMAFOROS, "{\"error\":\"no disponible\"}"));
        assertThrows(IllegalArgumentException.class, () -> parse(SEMAFOROS,
                "<?xml version=\"1.0\" ?><ServiceExceptionReport>Feature type unknown</ServiceExceptionReport>"));
    }

    @Test
    @DisplayName("EMT: agrupa las paradas repetidas en varias líneas y guarda las líneas en la descripción")
    void parseEmtGroupsStopsByCode() {
        String parada152 = "{\"parada\":{\"codParada\":152,\"nombreParada\":\"Postas - Lorenza Correa\","
                + "\"direccion\":\"AV POSTAS S/N\",\"latitud\":36.737835,\"longitud\":-4.4222507}}";
        String parada153 = "{\"parada\":{\"codParada\":153,\"nombreParada\":\"Emilio Díaz\","
                + "\"direccion\":\"CL EMILIO DÍAZ  31\",\"latitud\":36.73573,\"longitud\":-4.4235854}}";
        String json = "[{\"userCodLinea\":\"1\",\"paradas\":[" + parada152 + "," + parada153 + "]},"
                + "{\"userCodLinea\":\"C2\",\"paradas\":[" + parada152 + "]}]";

        List<OpenDataAsset> activos = parse(EMT, json);

        assertEquals(2, activos.size());
        OpenDataAsset postas = activos.get(0);
        assertEquals("152", postas.idExterno());
        assertEquals("Postas - Lorenza Correa", postas.nombre());
        assertEquals("Líneas: 1, C2", postas.descripcion());
        assertEquals(new BigDecimal("-4.422251"), postas.longitud());
        assertEquals("Líneas: 1", activos.get(1).descripcion());
        assertEquals("CL EMILIO DÍAZ 31", activos.get(1).direccion());
    }
}
