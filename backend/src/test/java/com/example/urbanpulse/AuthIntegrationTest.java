package com.example.urbanpulse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Prueba de extremo a extremo con el servidor real y la base de datos de desarrollo (data.sql):
 * login con usuarios de prueba, permisos por rol y códigos de error reales (incluida la página /error).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthIntegrationTest {

    private static final String DEV_PASSWORD = "urbanpulse-dev";
    private static final Pattern TOKEN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @LocalServerPort
    private int port;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> send(String method, String path, String body, String token)
            throws IOException, InterruptedException {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(body));
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String login(String correo) throws IOException, InterruptedException {
        HttpResponse<String> response = send("POST", "/api/auth/login",
                "{\"correo\":\"" + correo + "\",\"password\":\"" + DEV_PASSWORD + "\"}", null);
        assertEquals(200, response.statusCode(), response.body());
        Matcher m = TOKEN.matcher(response.body());
        assertTrue(m.find(), "La respuesta de login no contiene token");
        return m.group(1);
    }

    @Test
    @DisplayName("Los permisos por rol se aplican con tokens reales")
    void rolesAreEnforced() throws Exception {
        String admin = login("carlos.morales@urbanpulse.es");
        String citizen = login("david.serrano@urbanpulse.es");

        assertEquals(200, send("GET", "/api/incidents", null, null).statusCode());
        assertEquals(401, send("GET", "/api/users", null, null).statusCode());
        assertEquals(403, send("GET", "/api/users", null, citizen).statusCode());
        assertEquals(200, send("GET", "/api/users", null, admin).statusCode());

        String incidencia = "{\"titulo\":\"Prueba\",\"descripcion\":\"Test de integración\",\"latitud\":36.72,\"longitud\":-4.42}";
        assertEquals(401, send("POST", "/api/incidents", incidencia, null).statusCode());
        HttpResponse<String> created = send("POST", "/api/incidents", incidencia, citizen);
        assertEquals(201, created.statusCode(), created.body());
        assertTrue(created.body().contains("David Serrano"), "El creador debe ser el usuario del token");
    }

    @Test
    @DisplayName("Los errores conservan su código real (409, 400, 401) y no se convierten en 401")
    void errorStatusCodesArePreserved() throws Exception {
        String registro = "{\"nombre\":\"Prueba\",\"correo\":\"it-" + UUID.randomUUID()
                + "@example.com\",\"password\":\"segura-123\"}";
        assertEquals(201, send("POST", "/api/auth/register", registro, null).statusCode());
        assertEquals(409, send("POST", "/api/auth/register", registro, null).statusCode());
        assertEquals(400, send("POST", "/api/auth/register",
                "{\"nombre\":\"x\",\"correo\":\"no-es-correo\",\"password\":\"corta\"}", null).statusCode());
        assertEquals(401, send("POST", "/api/auth/login",
                "{\"correo\":\"lucia.navarro@urbanpulse.es\",\"password\":\"mala\"}", null).statusCode());
        assertEquals(404, send("GET", "/api/incidents/999999", null, null).statusCode());
    }
}
