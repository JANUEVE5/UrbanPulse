package com.example.urbanpulse.service.opendata;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Keeps the backend's RF22 foreign-key projection in sync with context-service.
 * The local projection preserves IDs already referenced by incidents.
 */
@Service
public class ContextAssetProjectionClient {
    private static final String UPSERT_SQL = """
            INSERT INTO "UrbanAsset"
                (tipo, nombre, descripcion, direccion, latitud, longitud, fuente, id_externo, actualizado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (fuente, id_externo) DO UPDATE SET
                tipo = EXCLUDED.tipo, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion,
                direccion = EXCLUDED.direccion, latitud = EXCLUDED.latitud, longitud = EXCLUDED.longitud,
                actualizado_en = EXCLUDED.actualizado_en
            """;

    private final String exportUrl;
    private final JdbcTemplate jdbc;
    private final TransactionOperations transactions;
    private final HttpClient http = HttpClient.newBuilder().build();
    private final JsonMapper mapper = JsonMapper.builder().build();

    public ContextAssetProjectionClient(
            @Value("${app.context-service.base-url}") String baseUrl,
            JdbcTemplate jdbc,
            TransactionOperations transactions) {
        this.exportUrl = baseUrl.replaceAll("/+$", "") + "/api/urban-assets/export";
        this.jdbc = jdbc;
        this.transactions = transactions;
    }

    public int refreshProjection() throws IOException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(exportUrl)).GET().build();
        final HttpResponse<String> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("La consulta a context-service fue interrumpida.", exception);
        }
        if (response.statusCode() != 200) {
            throw new IOException("context-service respondió HTTP " + response.statusCode() + ".");
        }

        JsonNode assets = mapper.readTree(response.body());
        if (!assets.isArray()) {
            throw new IOException("context-service devolvió una proyección de activos inválida.");
        }
        List<Object[]> rows = new ArrayList<>();
        for (JsonNode asset : assets) {
            rows.add(new Object[]{
                    asset.path("tipo").asString(), asset.path("nombre").asString(null),
                    asset.path("descripcion").asString(null), asset.path("direccion").asString(null),
                    asset.path("latitud").decimalValue(), asset.path("longitud").decimalValue(),
                    asset.path("fuente").asString(), asset.path("idExterno").asString(),
                    Timestamp.valueOf(LocalDateTime.now())
            });
        }
        if (!rows.isEmpty()) {
            transactions.executeWithoutResult(status -> jdbc.batchUpdate(UPSERT_SQL, rows));
        }
        return rows.size();
    }
}
