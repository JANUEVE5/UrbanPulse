package com.example.urbanpulse.service.opendata;

import com.example.urbanpulse.service.opendata.OpenDataSource.Formato;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionOperations;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrbanAssetSyncServiceTest {

    private static final OpenDataSource CAIDA =
            new OpenDataSource("caida", "FUENTE_AGUA", "Fuente", "/caida", Formato.GEOJSON_PUNTOS);
    private static final OpenDataSource VACIA =
            new OpenDataSource("vacia", "CONTENEDOR_RSU", "Contenedor", "/vacia", Formato.GEOJSON_PUNTOS);
    private static final OpenDataSource BUENA =
            new OpenDataSource("buena", "DESFIBRILADOR", "Desfibrilador", "/buena", Formato.GEOJSON_PUNTOS);

    @Mock
    private OpenDataClient client;

    @Mock
    private OpenDataParser parser;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private UrbanAssetSyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new UrbanAssetSyncService(client, parser, jdbcTemplate,
                TransactionOperations.withoutTransaction(), List.of(CAIDA, VACIA, BUENA));
    }

    @Test
    @DisplayName("Una fuente caída o vacía no impide sincronizar las demás ni borra datos (ADR-004)")
    @SuppressWarnings("unchecked")
    void sincronizarTodoToleratesFailingSources() throws IOException {
        byte[] contenido = "{}".getBytes();
        OpenDataAsset dea = new OpenDataAsset("14284", "DEA_714", "Biblioteca", "CALLE JUAN FERNÁNDEZ, 2",
                new BigDecimal("36.712000"), new BigDecimal("-4.433000"));

        when(client.descargar(CAIDA)).thenThrow(new IOException("El portal respondió con el código HTTP 500."));
        when(client.descargar(VACIA)).thenReturn(contenido);
        when(client.descargar(BUENA)).thenReturn(contenido);
        when(parser.parse(VACIA, contenido)).thenReturn(List.of());
        when(parser.parse(BUENA, contenido)).thenReturn(List.of(dea));

        List<UrbanAssetSyncService.Resultado> resultados = syncService.sincronizarTodo();

        assertEquals(3, resultados.size());
        assertNotNull(resultados.get(0).error());
        assertNotNull(resultados.get(1).error());
        assertNull(resultados.get(2).error());
        assertEquals(1, resultados.get(2).activos());

        // Solo se escribe la fuente que ha ido bien
        ArgumentCaptor<List<Object[]>> filas = ArgumentCaptor.forClass(List.class);
        verify(jdbcTemplate).batchUpdate(eq(UrbanAssetSyncService.UPSERT_SQL), filas.capture());
        Object[] fila = filas.getValue().get(0);
        assertEquals("DESFIBRILADOR", fila[0]);
        assertEquals("DEA_714", fila[1]);
        assertEquals("buena", fila[6]);
        assertEquals("14284", fila[7]);
    }

    @Test
    @DisplayName("Si todas las fuentes fallan no se escribe nada")
    void sincronizarTodoWithoutData() throws IOException {
        when(client.descargar(CAIDA)).thenThrow(new IOException("sin conexión"));
        when(client.descargar(VACIA)).thenThrow(new IOException("sin conexión"));
        when(client.descargar(BUENA)).thenThrow(new IOException("sin conexión"));

        syncService.sincronizarTodo();

        verify(jdbcTemplate, never()).batchUpdate(eq(UrbanAssetSyncService.UPSERT_SQL), anyList());
    }
}
