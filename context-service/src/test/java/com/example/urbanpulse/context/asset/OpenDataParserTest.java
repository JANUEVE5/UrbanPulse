package com.example.urbanpulse.context.asset;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static com.example.urbanpulse.context.asset.OpenDataSource.Formato.GEOJSON_PUNTOS;
import static org.junit.jupiter.api.Assertions.assertEquals;

class OpenDataParserTest {
    private final OpenDataParser parser = new OpenDataParser();

    @Test
    void parsesGeoJsonAndDiscardsCoordinatesOutsideMalaga() {
        OpenDataSource source = new OpenDataSource("test", "SEMAFORO", "Semáforo",
                "/test", GEOJSON_PUNTOS);
        String json = """
                {"type":"FeatureCollection","features":[
                  {"type":"Feature","geometry":{"type":"Point","coordinates":[-4.42,36.72]},
                   "properties":{"ID":"1","NOMBRE":"Centro"}},
                  {"type":"Feature","geometry":{"type":"Point","coordinates":[0,0]},
                   "properties":{"ID":"2","NOMBRE":"Fuera"}}
                ]}
                """;

        var assets = parser.parse(source, json.getBytes(StandardCharsets.UTF_8));

        assertEquals(1, assets.size());
        assertEquals("1", assets.get(0).idExterno());
        assertEquals("36.720000", assets.get(0).latitud().toPlainString());
    }
}
