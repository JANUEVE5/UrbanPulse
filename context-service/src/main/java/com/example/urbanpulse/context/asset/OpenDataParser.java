package com.example.urbanpulse.context.asset;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class OpenDataParser {
    private final JsonMapper mapper = JsonMapper.builder().build();

    public List<OpenDataAsset> parse(OpenDataSource source, byte[] bytes) {
        String json = new String(bytes, StandardCharsets.UTF_8);
        if (json.startsWith("\uFEFF")) {
            json = json.substring(1);
        }
        json = json.stripLeading();
        if (json.startsWith("<")) {
            throw new IllegalArgumentException("Open Data devolvió XML de error");
        }
        JsonNode root = mapper.readTree(json);
        return source.formato() == OpenDataSource.Formato.EMT_LINEAS
                ? parseEmt(root) : parseGeoJson(source, root);
    }

    private List<OpenDataAsset> parseGeoJson(OpenDataSource source, JsonNode root) {
        JsonNode features = root.path("features");
        if (!features.isArray()) {
            throw new IllegalArgumentException("GeoJSON FeatureCollection inválido");
        }
        List<OpenDataAsset> assets = new ArrayList<>();
        for (JsonNode feature : features) {
            JsonNode geometry = feature.path("geometry");
            JsonNode coordinates = geometry.path("coordinates");
            if (!"Point".equals(geometry.path("type").asString()) || !coordinates.isArray()
                    || coordinates.size() < 2) {
                continue;
            }
            JsonNode properties = feature.path("properties");
            String id = first(properties, "ID", "NUMHIDRANTE", "referencia", "ogc_fid", "FID");
            if (id == null) {
                continue;
            }
            addIfInMalaga(assets, id,
                    Optional.ofNullable(first(properties, "NOMBRE", "name")).orElse(source.nombre() + " " + id),
                    first(properties, "DESCRIPCION", "description"),
                    first(properties, "DIRECCION", "NOMVIALCOMPLETO"),
                    coordinates.get(1).asDouble(Double.NaN), coordinates.get(0).asDouble(Double.NaN));
        }
        return assets;
    }

    private List<OpenDataAsset> parseEmt(JsonNode root) {
        if (!root.isArray()) {
            throw new IllegalArgumentException("El catálogo EMT debe ser una lista");
        }
        Map<String, JsonNode> stops = new LinkedHashMap<>();
        Map<String, Set<String>> routes = new HashMap<>();
        for (JsonNode line : root) {
            String route = value(line.path("userCodLinea"));
            for (JsonNode item : line.path("paradas")) {
                JsonNode stop = item.path("parada");
                String id = value(stop.path("codParada"));
                if (id != null) {
                    stops.putIfAbsent(id, stop);
                    if (route != null) {
                        routes.computeIfAbsent(id, ignored -> new LinkedHashSet<>()).add(route);
                    }
                }
            }
        }
        List<OpenDataAsset> assets = new ArrayList<>();
        stops.forEach((id, stop) -> addIfInMalaga(assets, id, value(stop.path("nombreParada")),
                routes.containsKey(id) ? "Líneas: " + String.join(", ", routes.get(id)) : null,
                value(stop.path("direccion")), stop.path("latitud").asDouble(Double.NaN),
                stop.path("longitud").asDouble(Double.NaN)));
        return assets;
    }

    private static void addIfInMalaga(List<OpenDataAsset> assets, String id, String name, String description,
                                      String address, double lat, double lon) {
        if (!Double.isFinite(lat) || !Double.isFinite(lon) || lat < 36.4 || lat > 37.0 || lon < -4.9 || lon > -4.1) {
            return;
        }
        assets.add(new OpenDataAsset(cut(id, 100), cut(name, 200), cut(description, 400), cut(address, 200),
                BigDecimal.valueOf(lat).setScale(6, RoundingMode.HALF_UP),
                BigDecimal.valueOf(lon).setScale(6, RoundingMode.HALF_UP)));
    }

    private static String first(JsonNode properties, String... names) {
        for (String name : names) {
            Iterator<Map.Entry<String, JsonNode>> fields = properties.properties().iterator();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (field.getKey().equalsIgnoreCase(name)) {
                    String text = value(field.getValue());
                    if (text != null) {
                        return text;
                    }
                }
            }
        }
        return null;
    }

    private static String value(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode() || node.isContainer()) {
            return null;
        }
        String text = node.asString(null);
        if (text == null && node.isNumber()) {
            text = node.toString();
        }
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static String cut(String value, int max) {
        return value == null ? null : value.substring(0, Math.min(value.length(), max));
    }
}
