package com.example.urbanpulse.context.asset;

import com.example.urbanpulse.context.resilience.ProviderCircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class OpenDataSyncService {
    private static final Logger log = LoggerFactory.getLogger(OpenDataSyncService.class);
    private static final String UPSERT_SQL = """
            INSERT INTO "UrbanAsset"
                (tipo, nombre, descripcion, direccion, latitud, longitud, fuente, id_externo, actualizado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (fuente, id_externo) DO UPDATE SET
                tipo = EXCLUDED.tipo, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion,
                direccion = EXCLUDED.direccion, latitud = EXCLUDED.latitud, longitud = EXCLUDED.longitud,
                actualizado_en = EXCLUDED.actualizado_en
            """;

    private final OpenDataClient client;
    private final OpenDataParser parser;
    private final JdbcTemplate jdbc;
    private final TransactionOperations transactions;
    private final ProviderCircuitBreaker breaker;
    private final AtomicBoolean running = new AtomicBoolean();

    public OpenDataSyncService(OpenDataClient client, OpenDataParser parser, JdbcTemplate jdbc,
                               TransactionOperations transactions, ProviderCircuitBreaker breaker) {
        this.client = client;
        this.parser = parser;
        this.jdbc = jdbc;
        this.transactions = transactions;
        this.breaker = breaker;
    }

    public void sincronizarTodo() {
        if (!running.compareAndSet(false, true)) {
            log.info("Open Data ya tiene una sincronización en curso; se omite la ejecución");
            return;
        }
        try {
            for (OpenDataSource source : OpenDataCatalog.FUENTES) {
                try {
                    breaker.call("opendata", () -> {
                        List<OpenDataAsset> assets = parser.parse(source, client.descargar(source));
                        if (!assets.isEmpty()) {
                            save(source, assets);
                        } else {
                            log.warn("Open Data: fuente '{}' vacía; se mantienen los activos anteriores",
                                    source.codigo());
                        }
                        return assets.size();
                    });
                } catch (Exception exception) {
                    log.warn("Open Data: no se pudo sincronizar '{}'; se conserva la caché: {}",
                            source.codigo(), exception.getMessage());
                    if (breaker.getState("opendata") == ProviderCircuitBreaker.State.OPEN) {
                        break;
                    }
                }
            }
        } finally {
            running.set(false);
        }
    }

    private void save(OpenDataSource source, List<OpenDataAsset> assets) {
        Timestamp now = Timestamp.valueOf(LocalDateTime.now());
        List<Object[]> rows = assets.stream().map(asset -> new Object[]{
                source.tipo(), asset.nombre(), asset.descripcion(), asset.direccion(), asset.latitud(),
                asset.longitud(), source.codigo(), asset.idExterno(), now
        }).toList();
        transactions.executeWithoutResult(status -> jdbc.batchUpdate(UPSERT_SQL, rows));
    }
}
