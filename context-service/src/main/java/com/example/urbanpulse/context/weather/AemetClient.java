package com.example.urbanpulse.context.weather;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class AemetClient {
    private final String baseUrl;
    private final String apiKey;
    private final String municipalityCode;
    private final String stationCode;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL).build();
    private final JsonMapper mapper = JsonMapper.builder().build();

    public AemetClient(
            @Value("${app.aemet.base-url}") String baseUrl,
            @Value("${app.aemet.api-key:}") String apiKey,
            @Value("${app.aemet.municipio-codigo:29067}") String municipalityCode,
            @Value("${app.aemet.station-code:6156X}") String stationCode) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.municipalityCode = municipalityCode;
        this.stationCode = stationCode;
    }

    public JsonNode getStationObservation() throws IOException {
        requireKey();
        return fetchJson("/observacion/convencional/datos/estacion/" + stationCode);
    }

    public JsonNode getMunicipalityForecast() throws IOException {
        requireKey();
        JsonNode metadata = fetchJson("/prediccion/especifica/municipio/diaria/" + municipalityCode);
        String dataUrl = metadata.isArray() && !metadata.isEmpty()
                ? metadata.get(0).path("datos").asString(null) : metadata.path("datos").asString(null);
        if (dataUrl == null || dataUrl.isBlank()) {
            throw new IOException("AEMET no devolvió la URL de datos de predicción");
        }
        URI uri = URI.create(dataUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || !(uri.getHost().equals("aemet.es") || uri.getHost().endsWith(".aemet.es"))) {
            throw new IOException("AEMET devolvió una URL de predicción no válida");
        }
        return getUri(uri);
    }

    private JsonNode fetchJson(String path) throws IOException {
        String separator = path.contains("?") ? "&" : "?";
        URI uri = URI.create(baseUrl + path + separator + "api_key="
                + URLEncoder.encode(apiKey, StandardCharsets.UTF_8));
        return getUri(uri);
    }

    private JsonNode getUri(URI uri) throws IOException {
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json").GET().build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IOException("AEMET respondió HTTP " + response.statusCode());
            }
            JsonNode root = mapper.readTree(response.body());
            if (root.has("estado") && root.path("estado").asInt(200) >= 400) {
                throw new IOException("AEMET informó un error en la respuesta");
            }
            return root;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Consulta a AEMET interrumpida", e);
        }
    }

    private void requireKey() throws IOException {
        if (apiKey.isBlank()) {
            throw new IOException("AEMET_API_KEY no está configurada");
        }
    }
}
