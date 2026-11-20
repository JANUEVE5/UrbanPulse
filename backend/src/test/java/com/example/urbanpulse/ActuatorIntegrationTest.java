package com.example.urbanpulse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Observabilidad (ADR-018): Prometheus puede leer salud y métricas sin token, y las métricas incluyen
 * la latencia HTTP por endpoint y el pool de conexiones a PostgreSQL.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.context-service.projection.enabled=false")
class ActuatorIntegrationTest {

    @LocalServerPort
    private int port;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).GET().build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Test
    @DisplayName("health y prometheus son públicos y exponen métricas de HTTP y de HikariCP")
    void healthAndPrometheusArePublic() throws Exception {
        assertEquals(200, get("/actuator/health").statusCode());

        // Genera al menos una petición para que exista la serie http_server_requests
        get("/api/incidents/1");

        HttpResponse<String> metrics = get("/actuator/prometheus");
        assertEquals(200, metrics.statusCode());
        assertTrue(metrics.body().contains("http_server_requests_seconds_bucket"), "Falta el histograma HTTP");
        assertTrue(metrics.body().contains("hikaricp_connections_active"), "Faltan las métricas de HikariCP");
        assertTrue(metrics.body().contains("application=\"urbanpulse-api\""), "Falta la etiqueta application");
        assertTrue(metrics.body().contains("tomcat_threads_busy_threads"), "Faltan las métricas de hilos de Tomcat");
    }

    @Test
    @DisplayName("El resto de endpoints de Actuator exige token")
    void otherActuatorEndpointsRequireToken() throws Exception {
        assertEquals(401, get("/actuator/metrics").statusCode());
    }
}
