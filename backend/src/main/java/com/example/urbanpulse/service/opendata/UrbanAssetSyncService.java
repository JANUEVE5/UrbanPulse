package com.example.urbanpulse.service.opendata;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sincroniza los activos urbanos con Open Data Málaga (RF22, ADR-015).
 *
 * <p>Para cada fuente del {@link OpenDataCatalog}: descarga el fichero, lo interpreta y guarda los activos
 * con un <em>upsert</em> por {@code (fuente, id_externo)}: los nuevos se insertan y los existentes se
 * actualizan, así que repetir la sincronización no crea duplicados ni cambia los {@code id} a los que
 * apuntan las incidencias.
 *
 * <p>Degradación controlada (ADR-004, RF26): si una fuente falla o viene vacía, se registra en el log y se
 * conservan los activos que ya había; el resto de fuentes se sincroniza igualmente. Nada de esto afecta a
 * la creación de incidencias.
 */
@Service
public class UrbanAssetSyncService {

    private static final Logger log = LoggerFactory.getLogger(UrbanAssetSyncService.class);

    // ON CONFLICT es de PostgreSQL (ADR-002): inserta o actualiza en una sola sentencia
    static final String UPSERT_SQL = """
            INSERT INTO "UrbanAsset" (tipo, nombre, descripcion, direccion, latitud, longitud, fuente, id_externo, actualizado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (fuente, id_externo) DO UPDATE SET
                tipo = EXCLUDED.tipo,
                nombre = EXCLUDED.nombre,
                descripcion = EXCLUDED.descripcion,
                direccion = EXCLUDED.direccion,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                actualizado_en = EXCLUDED.actualizado_en
            """;

    /** Resultado de sincronizar una fuente. {@code error} es {@code null} si ha ido bien. */
    public record Resultado(String fuente, int activos, String error) {
    }

    private final OpenDataClient client;
    private final OpenDataParser parser;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionOperations transacciones;
    private final List<OpenDataSource> fuentes;
    private final AtomicBoolean enCurso = new AtomicBoolean(false);

    @Autowired
    public UrbanAssetSyncService(OpenDataClient client, OpenDataParser parser, JdbcTemplate jdbcTemplate,
                                 TransactionOperations transacciones) {
        this(client, parser, jdbcTemplate, transacciones, OpenDataCatalog.FUENTES);
    }

    UrbanAssetSyncService(OpenDataClient client, OpenDataParser parser, JdbcTemplate jdbcTemplate,
                          TransactionOperations transacciones, List<OpenDataSource> fuentes) {
        this.client = client;
        this.parser = parser;
        this.jdbcTemplate = jdbcTemplate;
        this.transacciones = transacciones;
        this.fuentes = fuentes;
    }

    /** Sincroniza todas las fuentes. Si ya hay una sincronización en marcha, no hace nada. */
    public List<Resultado> sincronizarTodo() {
        if (!enCurso.compareAndSet(false, true)) {
            log.info("Open Data: ya hay una sincronización en curso; se omite esta.");
            return List.of();
        }
        try {
            log.info("Open Data: sincronizando {} fuentes de activos urbanos…", fuentes.size());
            List<Resultado> resultados = new ArrayList<>();
            for (OpenDataSource fuente : fuentes) {
                resultados.add(sincronizar(fuente));
            }
            int total = resultados.stream().mapToInt(Resultado::activos).sum();
            long fallidas = resultados.stream().filter(r -> r.error() != null).count();
            log.info("Open Data: sincronización terminada. {} activos actualizados; {} de {} fuentes sin datos.",
                    total, fallidas, fuentes.size());
            return resultados;
        } finally {
            enCurso.set(false);
        }
    }

    Resultado sincronizar(OpenDataSource fuente) {
        try {
            List<OpenDataAsset> activos = parser.parse(fuente, client.descargar(fuente));
            if (activos.isEmpty()) {
                log.warn("Open Data: la fuente '{}' no tiene elementos; se conservan los activos anteriores.",
                        fuente.codigo());
                return new Resultado(fuente.codigo(), 0, "La fuente no tiene elementos.");
            }
            guardar(fuente, activos);
            log.info("Open Data: '{}' → {} activos.", fuente.codigo(), activos.size());
            return new Resultado(fuente.codigo(), activos.size(), null);
        } catch (Exception e) {
            log.warn("Open Data: la fuente '{}' no está disponible ({}); se conservan los activos anteriores.",
                    fuente.codigo(), e.getMessage());
            return new Resultado(fuente.codigo(), 0, e.getMessage());
        }
    }

    /** Guarda los activos de una fuente en una sola transacción: o se guardan todos o ninguno. */
    private void guardar(OpenDataSource fuente, List<OpenDataAsset> activos) {
        Timestamp ahora = Timestamp.valueOf(LocalDateTime.now());
        List<Object[]> filas = activos.stream()
                .map(a -> new Object[]{
                        fuente.tipo(), a.nombre(), a.descripcion(), a.direccion(),
                        a.latitud(), a.longitud(), fuente.codigo(), a.idExterno(), ahora})
                .toList();
        transacciones.executeWithoutResult(estado -> jdbcTemplate.batchUpdate(UPSERT_SQL, filas));
    }
}
