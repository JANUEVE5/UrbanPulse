package com.example.urbanpulse.config;

import com.example.urbanpulse.service.opendata.UrbanAssetSyncService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cuándo se sincronizan los activos urbanos con Open Data Málaga (ADR-015):
 * <ul>
 *   <li>al arrancar, en un hilo aparte para no retrasar el arranque de la API;</li>
 *   <li>después, según {@code OPENDATA_SYNC_CRON} (por defecto, cada día a las 4:00).</li>
 * </ul>
 * Se desactiva con {@code OPENDATA_SYNC_ENABLED=false} (por ejemplo, en los tests).
 */
@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.opendata.sync.enabled", havingValue = "true")
public class OpenDataSyncScheduler {

    private final UrbanAssetSyncService syncService;

    public OpenDataSyncScheduler(UrbanAssetSyncService syncService) {
        this.syncService = syncService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        Thread hilo = new Thread(syncService::sincronizarTodo, "opendata-sync-inicial");
        hilo.setDaemon(true);
        hilo.start();
    }

    @Scheduled(cron = "${app.opendata.sync.cron}")
    public void programada() {
        syncService.sincronizarTodo();
    }
}
