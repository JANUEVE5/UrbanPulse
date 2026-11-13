package com.example.urbanpulse.service.opendata;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Descarga los ficheros del portal de Open Data Málaga ({@code OPENDATA_BASE_URL}). */
@Component
public class OpenDataClient {

    private static final Duration TIEMPO_CONEXION = Duration.ofSeconds(10);
    private static final Duration TIEMPO_RESPUESTA = Duration.ofSeconds(60);

    private final String baseUrl;
    private final HttpClient http;

    public OpenDataClient(@Value("${app.opendata.base-url}") String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.http = HttpClient.newBuilder()
                .connectTimeout(TIEMPO_CONEXION)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    /**
     * Devuelve el contenido del fichero de la fuente.
     *
     * @throws IOException si el portal no responde o responde con un error
     */
    public byte[] descargar(OpenDataSource fuente) throws IOException {
        HttpRequest peticion = HttpRequest.newBuilder(URI.create(baseUrl + fuente.ruta()))
                .timeout(TIEMPO_RESPUESTA)
                .header("Accept", "application/json")
                .GET()
                .build();
        try {
            HttpResponse<byte[]> respuesta = http.send(peticion, HttpResponse.BodyHandlers.ofByteArray());
            if (respuesta.statusCode() != 200) {
                throw new IOException("El portal respondió con el código HTTP " + respuesta.statusCode() + ".");
            }
            return respuesta.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Descarga interrumpida.", e);
        }
    }
}
