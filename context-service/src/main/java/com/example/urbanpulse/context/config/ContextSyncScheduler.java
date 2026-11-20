package com.example.urbanpulse.context.config;

import com.example.urbanpulse.context.asset.OpenDataSyncService;
import com.example.urbanpulse.context.weather.WeatherSyncService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.sync.enabled", havingValue = "true", matchIfMissing = true)
public class ContextSyncScheduler {
    private final OpenDataSyncService openData;
    private final WeatherSyncService weather;

    public ContextSyncScheduler(OpenDataSyncService openData, WeatherSyncService weather) {
        this.openData = openData;
        this.weather = weather;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initialSync() {
        Thread openDataThread = new Thread(openData::sincronizarTodo, "context-opendata-initial-sync");
        openDataThread.setDaemon(true);
        openDataThread.start();
        Thread weatherThread = new Thread(weather::sincronizar, "context-aemet-initial-sync");
        weatherThread.setDaemon(true);
        weatherThread.start();
    }

    @Scheduled(cron = "${app.opendata.sync.cron:0 0 4 * * *}")
    public void scheduledOpenDataSync() {
        openData.sincronizarTodo();
    }

    @Scheduled(cron = "${app.aemet.sync.cron:0 0 * * * *}")
    public void scheduledWeatherSync() {
        weather.sincronizar();
    }
}
