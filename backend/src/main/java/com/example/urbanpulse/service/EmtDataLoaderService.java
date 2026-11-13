package com.example.urbanpulse.service;

import com.example.urbanpulse.entity.UrbanAsset;
import com.example.urbanpulse.repository.UrbanAssetRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio encargado de la carga estática de las paradas de autobús de la EMT de Málaga
 * al iniciar la aplicación (RF22, RF26).
 * Lee el archivo CSV 'data/lineasyparadas.csv' (o 'data/paradas_emt.csv' como alternativa),
 * verifica si la parada ya existe en la base de datos y la almacena con tipo 'BUS_STOP'
 * y sus correspondientes metadatos en formato JSON.
 */
@Service
public class EmtDataLoaderService {

    private static final Logger log = LoggerFactory.getLogger(EmtDataLoaderService.class);

    private final UrbanAssetRepository urbanAssetRepository;

    public EmtDataLoaderService(UrbanAssetRepository urbanAssetRepository) {
        this.urbanAssetRepository = urbanAssetRepository;
    }

    @PostConstruct
    @Transactional
    public void cargarParadasEmt() {
        Resource resource = new ClassPathResource("data/lineasyparadas.csv");

        if (!resource.exists()) {
            log.warn("EmtDataLoaderService: no se encontró archivo CSV en data/lineasyparadas.csv ni data/paradas_emt.csv");
            return;
        }

        log.info("EmtDataLoaderService: cargando paradas EMT desde {}", resource.getFilename());

        int nuevas = 0;
        int omitidas = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                log.warn("EmtDataLoaderService: el archivo CSV está vacío.");
                return;
            }

            List<String> headers = parseCsvLine(headerLine);
            Map<String, Integer> colIndex = new HashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                colIndex.put(headers.get(i).trim().toLowerCase(), i);
            }

            Integer idxCodParada = colIndex.getOrDefault("codparada", 17);
            Integer idxNombreParada = colIndex.getOrDefault("nombreparada", 18);
            Integer idxDireccion = colIndex.getOrDefault("direccion", 19);
            Integer idxLon = colIndex.getOrDefault("lon", 20);
            Integer idxLat = colIndex.getOrDefault("lat", 21);
            Integer idxLineas = colIndex.getOrDefault("lineas", 22);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;

                List<String> row = parseCsvLine(line);
                if (row.size() <= Math.max(idxNombreParada, Math.max(idxLat, idxLon))) {
                    continue;
                }

                String codParada = getCol(row, idxCodParada);
                String nombreParada = getCol(row, idxNombreParada);
                String direccion = getCol(row, idxDireccion);
                String lonStr = getCol(row, idxLon);
                String latStr = getCol(row, idxLat);
                String lineas = getCol(row, idxLineas);

                if (nombreParada.isBlank()) {
                    continue;
                }

                // Verificar si la parada ya existe en base de datos para no duplicar
                boolean existe = urbanAssetRepository.findByTipoAndNombre("BUS_STOP", nombreParada).isPresent();
                if (existe) {
                    omitidas++;
                    continue;
                }

                BigDecimal lat = null;
                BigDecimal lon = null;
                try {
                    if (!latStr.isBlank() && !lonStr.isBlank()) {
                        lat = new BigDecimal(latStr.trim());
                        lon = new BigDecimal(lonStr.trim());
                    }
                } catch (Exception ignored) {
                    // Si las coordenadas no son numéricas válidas, se permite guardar con null o ignorar
                }

                UrbanAsset asset = new UrbanAsset();
                asset.setTipo("BUS_STOP");
                asset.setNombre(nombreParada);
                asset.setLatitud(lat);
                asset.setLongitud(lon);
                asset.setFuente("OpenData Málaga - EMT");

                // Campo metadatos en formato JSON con nombre de la parada y detalles
                String metadatosJson = String.format(
                        "{\"nombreParada\":\"%s\",\"codParada\":\"%s\",\"lineas\":\"%s\",\"direccion\":\"%s\"}",
                        escapeJson(nombreParada),
                        escapeJson(codParada),
                        escapeJson(lineas),
                        escapeJson(direccion)
                );
                asset.setMetadatos(metadatosJson);

                urbanAssetRepository.save(asset);
                nuevas++;
            }

            log.info("EmtDataLoaderService finalizado: {} paradas nuevas insertadas, {} ya existentes omitidas.", nuevas, omitidas);

        } catch (Exception ex) {
            log.error("Error al procesar el archivo CSV de paradas EMT: {}", ex.getMessage(), ex);
        }
    }

    private String getCol(List<String> row, Integer index) {
        if (index == null || index < 0 || index >= row.size()) {
            return "";
        }
        return row.get(index).trim();
    }

    /**
     * Parsea una línea de CSV respetando valores entrecomillados.
     */
    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    sb.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        result.add(sb.toString());
        return result;
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }
}
