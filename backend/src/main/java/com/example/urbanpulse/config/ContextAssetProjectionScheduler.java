package com.example.urbanpulse.config;

import com.example.urbanpulse.service.opendata.ContextAssetProjectionClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Cuándo se actualiza la proyección RF22 desde context-service (ADR-019):
 * <ul>
 *   <li>al arrancar, en un hilo aparte para no retrasar el arranque de la API;</li>
 *   <li>después, cada cinco minutos para conservar el comportamiento RF22 de la API principal.</li>
 * </ul>
 * Se desactiva con {@code CONTEXT_ASSET_PROJECTION_ENABLED=false} (por ejemplo, en los tests).
 */
@Component
@EnableScheduling
@ConditionalOnProperty(name = "app.context-service.projection.enabled", havingValue = "true", matchIfMissing = true)
public class ContextAssetProjectionScheduler {

    private final ContextAssetProjectionClient projectionClient;

    public ContextAssetProjectionScheduler(ContextAssetProjectionClient projectionClient) {
        this.projectionClient = projectionClient;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alArrancar() {
        Thread hilo = new Thread(this::actualizar, "context-assets-projection-inicial");
        hilo.setDaemon(true);
        hilo.start();
    }

    @Scheduled(cron = "${app.context-service.projection.cron:0 */5 * * * *}")
    public void programada() {
        actualizar();
    }

    private void actualizar() {
        try {
            projectionClient.refreshProjection();
        } catch (Exception exception) {
            org.slf4j.LoggerFactory.getLogger(ContextAssetProjectionScheduler.class)
                    .warn("No se pudo actualizar la proyección local RF22; se conservan sus activos: {}",
                            exception.getMessage());
        }
    }
}
